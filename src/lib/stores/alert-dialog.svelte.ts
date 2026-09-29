export type AlertDialogType = 'success' | 'info' | 'warning' | 'error'

export interface AlertDialogOptions {
    type?: AlertDialogType
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    /** Tampilkan tombol Cancel. Default: false (alert biasa cuma punya 1 tombol) */
    showCancel?: boolean
    /** Kalau true, dialog gak bisa ditutup lewat klik di luar / tombol Escape */
    disableOutsideClose?: boolean
    /** Dijalankan saat user klik tombol confirm. Bisa async — tombol otomatis loading */
    onConfirm?: () => void | Promise<void>
    /** Dijalankan saat user klik cancel / klik di luar / escape */
    onCancel?: () => void
}

class AlertDialogStore {
    open = $state(false)
    type = $state<AlertDialogType>('info')
    title = $state('')
    description = $state<string | undefined>(undefined)
    confirmText = $state('OK')
    cancelText = $state('Batal')
    showCancel = $state(false)
    disableOutsideClose = $state(false)
    loading = $state(false)

    #onConfirm: (() => void | Promise<void>) | undefined
    #onCancel: (() => void) | undefined

    /** API utama — dipakai internal oleh shorthand methods di bawah */
    show(options: AlertDialogOptions) {
        this.type = options.type ?? 'info'
        this.title = options.title
        this.description = options.description
        this.confirmText = options.confirmText ?? 'OK'
        this.cancelText = options.cancelText ?? 'Batal'
        this.showCancel = options.showCancel ?? false
        this.disableOutsideClose = options.disableOutsideClose ?? false
        this.#onConfirm = options.onConfirm
        this.#onCancel = options.onCancel
        this.loading = false
        this.open = true
    }

    // ── Shorthand untuk alert biasa (1 tombol) ────────────────
    success(
        title: string,
        description?: string,
        options?: Partial<AlertDialogOptions>
    ) {
        this.show({ type: 'success', title, description, ...options })
    }
    info(
        title: string,
        description?: string,
        options?: Partial<AlertDialogOptions>
    ) {
        this.show({ type: 'info', title, description, ...options })
    }
    warning(
        title: string,
        description?: string,
        options?: Partial<AlertDialogOptions>
    ) {
        this.show({ type: 'warning', title, description, ...options })
    }
    error(
        title: string,
        description?: string,
        options?: Partial<AlertDialogOptions>
    ) {
        this.show({ type: 'error', title, description, ...options })
    }

    /**
     * Untuk kasus konfirmasi (2 tombol) yang bisa di-await.
     * Resolve `true` kalau confirm, `false` kalau cancel/close.
     */
    confirm(options: Omit<AlertDialogOptions, 'showCancel'>): Promise<boolean> {
        return new Promise(resolve => {
            this.show({
                ...options,
                showCancel: true,
                onConfirm: async () => {
                    await options.onConfirm?.()
                    resolve(true)
                },
                onCancel: () => {
                    options.onCancel?.()
                    resolve(false)
                }
            })
        })
    }

    async handleConfirm() {
        if (this.#onConfirm) {
            try {
                this.loading = true
                await this.#onConfirm()
            } finally {
                this.loading = false
            }
        }
        this.open = false
    }

    handleCancel() {
        this.#onCancel?.()
        this.open = false
    }

    close() {
        this.open = false
    }
}

export const alertDialog = new AlertDialogStore()

/**Example **/
// async function handleDeleteTenant(id: string) {
// 	const confirmed = await alertDialog.confirm({
// 		type: 'warning',
// 		title: 'Hapus Tenant?',
// 		description: 'Tindakan ini tidak bisa dibatalkan. Semua data terkait akan ikut terhapus.',
// 		confirmText: 'Ya, Hapus',
// 		cancelText: 'Batal',
// 		disableOutsideClose: true,
// 		onConfirm: async () => {
// 			await deleteTenant(id); // tombol otomatis nunjukin spinner selama ini jalan
// 		}
// 	});

// 	if (confirmed) {
// 		alertDialog.success('Terhapus', 'Tenant berhasil dihapus.');
// 	}
// }
