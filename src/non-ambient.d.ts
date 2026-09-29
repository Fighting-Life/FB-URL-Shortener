/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { LucideProps } from '@lucide/svelte';
import type { Component } from 'svelte';
import type { SVGAttributes } from 'svelte/elements';
declare global {
  type ToastMessage = {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  };
  interface CountryItem {
    name: string;
    code: string;
    emoji: string;
    unicode: string;
    image: string;
    dial_code: string;
    minLength: number;
    maxLength: number;
    regexPattern: string; // Regex pattern for phone number validation
  }
  interface TimezoneOption {
    zone: string;
    gmt: string;
    name: string;
  }
  interface DateRangeChartLabel {
    dates: Date[];
    labels: string[];
  }
  interface MenuItem {
    id: number;
    title: string;
    url: string;
    icon?: Component<SVGAttributes<SVGSVGElement>, {}, string>;
    child?: {
      title: string;
      url: string;
      icon?: Component<SVGAttributes<SVGSVGElement>, {}, string>;
    }[];
  }
  interface BreadcrumbItem {
    name?: string;
    title: string;
    href: string;
  }
  interface NavItem {
    title: string;
    href: string;
    icon?: Component<LucideProps, {}, ''>;
    isActive?: boolean;
    items?: NavMenu[];
  }
  interface NavMenu {
    title: string;
    url: string;
    icon?: Component<LucideProps, {}, ''>;
    isActive?: boolean;
    items?: NavMenu[];
  }
  type BreadcrumbItemType = BreadcrumbItem;

  type StatCard = {
    title: string;
    description?: string;
    icon: Component<LucideProps, {}, string>;
    value?: number;
    variation?: number;
    bgColor?: string;
    borderColor?: string;
    iconColor?: string;
    textColor?: string;
  };
  interface TimeComponents {
    hours: number;
    minutes: number;
    seconds: number;
  }
  interface DayStat {
    date: string;
    in: number;
    out: number;
  }
}

export { };
export { };
