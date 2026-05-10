'use client';

import { Button } from '@packages/ui/components/button';
import { fieldSurface } from '@packages/ui/styles/classes';
import { cn } from '@packages/ui/utils/cn';
import { Send } from 'lucide-react';
import {
	type ChangeEvent,
	type FC,
	type FormEvent,
	type KeyboardEvent,
	useCallback,
	useRef,
	useState,
} from 'react';

interface ChatComposerProps {
	onSend: (content: string) => void;
	isDisabled?: boolean;
	isSending?: boolean;
	className?: string;
	placeholder?: string;
	maxLength?: number;
}

export const ChatComposer: FC<ChatComposerProps> = ({
	onSend,
	isDisabled,
	isSending,
	className,
	placeholder = 'Digite uma mensagem...',
	maxLength = 2000,
}) => {
	const [content, setContent] = useState('');
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = useCallback(
		(e?: FormEvent) => {
			e?.preventDefault();

			const trimmed = content.trim();
			if (!trimmed || isDisabled || isSending) return;

			onSend(trimmed);
			setContent('');
		},
		[content, isDisabled, isSending, onSend],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	const handleTextAreaChange = useCallback(
		(e: ChangeEvent<HTMLTextAreaElement>) => {
			setContent(e.target.value);
		},
		[],
	);

	const isSubmitDisabled = !content.trim() || isDisabled || isSending;

	return (
		<form
			onSubmit={handleSubmit}
			className={cn(
				'flex items-end gap-2 p-4 border-t border-white/5',
				className,
			)}
		>
			<div className="relative flex-1">
				<textarea
					ref={textAreaRef}
					value={content}
					onChange={handleTextAreaChange}
					onKeyDown={handleKeyDown}
					disabled={isDisabled || isSending}
					placeholder={placeholder}
					aria-label="Mensagem do chat"
					maxLength={maxLength}
					className={cn(
						fieldSurface,
						'min-h-[40px] max-h-[120px] py-2.5 resize-none leading-normal scrollbar-hide',
					)}
					rows={1}
				/>
				{isSending && (
					<div className="absolute right-3 bottom-2.5">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-hextech-cyan border-t-transparent" />
					</div>
				)}
			</div>
			<Button
				type="submit"
				size="icon"
				variant="primary"
				disabled={isSubmitDisabled}
				aria-label="Enviar mensagem"
				className="h-10 w-10 shrink-0"
			>
				<Send className="h-4 w-4" />
			</Button>
		</form>
	);
};
