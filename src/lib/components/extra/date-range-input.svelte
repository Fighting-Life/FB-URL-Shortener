<script lang="ts">
	import {
		DateFormatter,
		CalendarDate,
		type DateValue,
		getLocalTimeZone
	} from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { CalendarIcon } from '@lucide/svelte';

	let {
		modelValue = $bindable(),
		onchange,
		disabled,
		class: className
	}: {
		modelValue?: { start: string; end: string };
		onchange?: (value: { start: string; end: string } | null) => void;
		disabled?: boolean;
		class?: string;
	} = $props();

	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	let contentRef = $state<HTMLElement | null>(null);
	let isOpen = $state(false);
	const timezone = getLocalTimeZone();

	const parseDateString = (value: string): CalendarDate | null => {
		const trimmed = value.trim();
		if (!trimmed) return null;

		const dateOnly = trimmed.includes('T') ? trimmed.slice(0, 10) : trimmed.slice(0, 10);
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
		if (!match) return null;

		const year = Number(match[1]);
		const month = Number(match[2]);
		const day = Number(match[3]);

		if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
		return new CalendarDate(year, month, day);
	};
	const calendarDateToQuery = (value: DateValue): string => {
		const date =
			value instanceof CalendarDate ? value : new CalendarDate(value.year, value.month, value.day);
		return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
	};

	let value = $state<DateRange | undefined>(undefined);

	$effect(() => {
		if (modelValue?.start && modelValue.end) {
			const startCal = parseDateString(modelValue.start);
			const endCal = parseDateString(modelValue.end);

			if (startCal && endCal) {
				value = {
					start: startCal,
					end: endCal
				};
			} else {
				value = undefined;
			}
		} else {
			value = undefined;
		}
	});

	const handleDateChange = (range: DateRange) => {
		if (!range.start || !range.end) {
			return;
		}

		try {
			const result = {
				start: calendarDateToQuery(range.start),
				end: calendarDateToQuery(range.end)
			};

			// Update internal value
			value = range;

			// Update modelValue for 2-way binding
			modelValue = result;

			// Call onchange callback if provided
			if (onchange) {
				onchange(result);
			}

			// Close popover setelah select
			setTimeout(() => {
				isOpen = false;
			}, 300);
		} catch (error) {
			console.error('Error converting date range:', error);
			if (onchange) {
				onchange(null);
			}
		}
	};

	const displayText = $derived.by(() => {
		if (!value?.start) return 'Pick a date range';

		try {
			const startDate = value.start instanceof CalendarDate ? value.start : undefined;

			if (value.end) {
				const endDate = value.end instanceof CalendarDate ? value.end : undefined;
				if (startDate && endDate) {
					const display = `${df.format(startDate.toDate(timezone))} - ${df.format(endDate.toDate(timezone))}`;
					return display;
				}
				return 'Pick a date range';
			} else {
				return startDate ? df.format(startDate.toDate(timezone)) : 'Pick a date range';
			}
		} catch {
			const display = 'Pick a date range';
			return display;
		}
	});

	// Computed to check if we have a valid selection
	const hasValue = $derived(!!value?.start && !!value?.end);
</script>

<Popover.Root bind:open={isOpen}>
	<Popover.Trigger
		class={cn(
			buttonVariants({
				variant: 'outline'
			}),
			className,
			'justify-start text-left font-normal',
			!hasValue && 'text-muted-foreground'
		)}
		{disabled}
	>
		<CalendarIcon class="mr-2 h-4 w-4" />
		{displayText}
	</Popover.Trigger>
	<Popover.Content bind:ref={contentRef} class="w-auto p-0" align="start">
		<RangeCalendar
			bind:value
			class="rounded-md border"
			weekdayFormat="short"
			numberOfMonths={2}
			{disabled}
			onValueChange={handleDateChange}
		/>
	</Popover.Content>
</Popover.Root>
