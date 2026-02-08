export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

let nextId = 0;

class ToastStore {
	toasts = $state<Toast[]>([]);

	add(message: string, type: ToastType, duration = 3000) {
		const id = nextId++;
		this.toasts.push({ id, message, type });
		setTimeout(() => this.remove(id), duration);
	}

	remove(id: number) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	success(message: string) {
		this.add(message, 'success');
	}

	error(message: string) {
		this.add(message, 'error', 5000);
	}

	info(message: string) {
		this.add(message, 'info');
	}
}

export const toast = new ToastStore();
