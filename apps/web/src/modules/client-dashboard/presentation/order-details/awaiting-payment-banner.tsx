export const AwaitingPaymentBanner = () => (
	<div className="flex items-center gap-3 rounded-sm border border-hextech-gold/20 bg-hextech-gold/5 px-4 py-3">
		<span className="relative flex h-2 w-2 shrink-0">
			<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hextech-gold opacity-75" />
			<span className="relative inline-flex h-2 w-2 rounded-full bg-hextech-gold" />
		</span>
		<p className="text-xs font-bold tracking-wider text-hextech-gold">
			Aguardando a confirmação do pagamento. Esta página atualiza
			automaticamente assim que o pagamento for aprovado.
		</p>
	</div>
);
