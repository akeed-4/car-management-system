import { Injectable } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Injectable({
  providedIn: 'root',
})
export class DateManagerService {
  constructor() {}

  private loadMoment() {
    var moment = require('moment');
    return moment;
  }

  formatToYearFirst(date: Date | string,isDateTime: boolean = false) {
    const moment = this.loadMoment();
    if (isDateTime) {
      return moment(date).format('YYYY-MM-DD hh:mm:ss a');
    }
    return moment(date).format('YYYY-MM-DD');
  }

  formatToDayFirst(date: Date | string,isDateTime: boolean = false) {
    const moment = this.loadMoment();
    if (isDateTime) {
      return moment(date).format('DD/MM/YYYY hh:mm:ss A');
    }
    return moment(date).format('DD/MM/YYYY');
  }


  async addDays(date: Date | string, days: number): Promise<string> {
    const moment = await this.loadMoment();
    return moment(date).add(days, 'd');
  }

  async addMonths(date: Date | string, months: number): Promise<string> {
    const moment = await this.loadMoment();
    return moment(date).add(months, 'M');
  }

  async isValidDate(date: any): Promise<boolean> {
    const moment = await this.loadMoment();
    return moment(date).isValid();
  }

  getToday() {
    var moment = require('moment');
    return moment(new Date()).format('YYYY-MM-DD');
  }

  getTodayDayFirst() {
    var moment = require('moment');
    return moment(new Date()).format('DD/MM/YYYY');
  }

  getCurrentDateTimeDayFirst() {
    var moment = require('moment');
    return moment(new Date()).format('DD/MM/YYYY HH:mm:ss A');
  }

  goBackSpecificDays(date: Date, days: number): Date {
    return new Date(date.setDate(date.getDate() - days));
  }

  goBackSpecificMonths(date: Date, months: number): Date {
    return new Date(date.setMonth(date.getMonth() - months));
  }

  goBackSpecificYears(date: Date, years: number) {
    var moment = require('moment');
    return moment(date).subtract(years, 'years').format('YYYY-MM-DD');
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getWeekday(date: Date): number {
    return date.getDay();
  }

  getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  getDaysDiff(date1: Date, date2: Date): number {
    const diffInMilliseconds = date2.getTime() - date1.getTime();
    return Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));
  }

  getMonthsDiff(date1: Date, date2: Date): number {
    return date2.getMonth() - date1.getMonth() + 12 * (date2.getFullYear() - date1.getFullYear());
  }

  getYearsDiff(date1: Date, date2: Date): number {
    return date2.getFullYear() - date1.getFullYear();
  }

  isBefore(date1: Date, date2: Date): boolean {
    return date1.getTime() < date2.getTime();
  }

  isAfter(date1: Date, date2: Date): boolean {
    return date1.getTime() > date2.getTime();
  }

  isSame(date1: Date, date2: Date): boolean {
    return date1.getTime() === date2.getTime();
  }

  isSameOrBefore(date1: Date, date2: Date): boolean {
    return date1.getTime() <= date2.getTime();
  }

  isSameOrAfter(date1: Date, date2: Date): boolean {
    return date1.getTime() >= date2.getTime();
  }

  isToday(date: Date): boolean {
    return this.isSame(new Date(), date);
  }

  diffInDays(date1: Date, date2: Date) {
    const moment = this.loadMoment();
    return moment(date1).diff(moment(date2), 'days');
  }
}

// date manager for devextreme grid
export function formatDateCell(
  dateValue: any,
  format: 'dd/MM/yyyy' | 'dd/MM/yyyy hh:mm:ss a',
  languageService: LanguageService
): string | null {
  if (!dateValue) return null;
  const d = new Date(dateValue);

  const pad = (n: number) => n < 10 ? '0' + n : n;
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  if (format === 'dd/MM/yyyy') {
    return `${day}/${month}/${year}`;
  }

  // For 'dd/MM/yyyy hh:mm:ss a'
  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hourStr = pad(hours);

  // Use Arabic AM/PM if current language is Arabic
  if (languageService.getCurrentLanguage() === 'ar') {
    ampm = ampm === 'AM' ? 'ص' : 'م';
  }

  return `${day}/${month}/${year} ${hourStr}:${minutes}:${seconds} ${ampm}`;
}