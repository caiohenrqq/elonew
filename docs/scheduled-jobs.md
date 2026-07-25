# Scheduled Jobs

Recurring work belongs to the application, not to the host. Every schedule is
declared in code, stored in Redis by BullMQ, and logged like any other workflow.
There is no cron container, no host crontab, and no `wget` in an alpine image.

## Where a schedule lives

`apps/workers/src/modules/scheduled-tasks/domain/scheduled-tasks.registry.ts` is
the declared inventory. One entry per recurring job:

| Task | Default cron | Calls |
|---|---|---|
| `reconcile_stale_checkouts` | `*/10 * * * *` | `POST /payments/internal/reconcile-stale-checkouts` |
| `cleanup_expired_order_quotes` | `*/15 * * * *` | `POST /orders/internal/quotes/cleanup-expired` |

Cron expressions and batch sizes come from `workers.env`
(`STALE_CHECKOUT_RECONCILE_CRON`, `ORDER_QUOTE_CLEANUP_CRON`, and the matching
`_LIMIT` values), so an interval can change with a workers restart instead of a
release. An invalid expression fails env validation at boot rather than silently
never firing.

## How it runs

On boot the workers container:

1. upserts a BullMQ job scheduler for every declared task (idempotent, so a
   redeploy converges instead of duplicating);
2. **removes any scheduler in Redis that is not declared in code**, so a schedule
   cannot outlive the commit that introduced it;
3. starts one worker on the `scheduled-tasks` queue.

Each tick resolves the task name to its route **from the registry**, never from
the job payload — a stale or tampered payload in Redis cannot make the worker
call an arbitrary internal endpoint. Failures retry 3 times with exponential
backoff.

## Adding a scheduled job

1. Add the internal route constant to
   `packages/shared/src/scheduled-tasks/scheduled-tasks.contract.ts` and use it in
   the controller, so the API and the worker cannot drift.
2. Add the entry to the registry, with its cron read from settings.
3. Add the env vars to `worker-env.schema.ts` and `workers.env.example`.
4. Add it to the table above.

The endpoint must be idempotent and safe to run twice: BullMQ delivers at least
once, and a retry re-runs it.

## Seeing what is scheduled

- Admin dashboard: **Admin → Trabalhos agendados** lists every scheduler with its
  cron and next run, plus queue depth and failures.
- From a shell:

```bash
docker exec elonew-prod-redis-1 redis-cli zrange bull:scheduled-tasks:repeat 0 -1 withscores
```

- In Loki: `{service="workers"} | json | event="scheduled_task.lifecycle"`. Every
  attempt emits one event with `task_name`, `cron`, `job_id`, `attempt`,
  `api_status`, `api_request_id`, `outcome` and `duration_ms`. The
  `api_request_id` matches the `x-request-id` on the corresponding API request.

## Limits worth knowing

- **Missed runs are not replayed.** BullMQ schedules the next occurrence; it does
  not backfill ticks missed while the workers container was down. Every task here
  is an idempotent sweep, so the next tick is sufficient.
- **Redis is required.** A schedule lives in Redis, which is already a hard
  dependency of the queue. If Redis is wiped, schedules are re-armed on the next
  workers boot.
- **`OutboxDispatcherService` is not here.** It is an in-process `setInterval` in
  the API because an outbox needs sub-second latency. It is listed as
  `in-process` in the admin view so the page is not misleading.

## Migrating off the old cron (one-time)

Before this change, production ran the reconciliation from a **host crontab** on
the VPS every 10 minutes, and the repo also declared an unused
`stale-checkout-reconciler` compose service. Both are gone from the repo. The
host crontab must be removed **in the same release**, or reconciliation runs
twice:

```bash
ssh elonew-vps
crontab -l                                              # confirm what is there
crontab -l | grep -v reconcile-stale-checkouts | crontab -
crontab -l                                              # confirm it is gone
rm -f ~/bin/reconcile-stale-checkouts ~/reconcile-stale-checkouts.log
```

Then verify the workers container armed the schedules:

```bash
docker logs elonew-prod-workers-1 --tail 50 | grep scheduled_task.consumer
docker exec elonew-prod-redis-1 redis-cli zrange bull:scheduled-tasks:repeat 0 -1
```
