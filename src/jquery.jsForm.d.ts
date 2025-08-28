/// <reference path="../3rdparty/jquery.d.ts" />

// Type definitions for jsForm, jsFormControls and jsFormUplod
// Project: https://github.com/corinis/jsForm
// TypeScript Version: 4.4.3

interface JQuery {

	/**
	 * Definition for jsForm plugin
	 * @file jquery.jsForm.js
	 * * */
	 jsForm(): JQuery;
	 jsForm(func:any): JQuery;
	 jsForm(func:string, opts:any): JQuery;

}

interface JQueryStatic {

	/**
	 * Definition for jsFormControl plugin
	 * @file jquery.jsForm.controls.js
	 */
	jsFormControls: {
		Format: {
			// @ts-ignore
			asMoment(val: string | number | Date | DateTime): luxon.DateTime;

			asDate(val: string | number): Date;

			currency(val: number): string;

			decimal(val: number): string;

			date(val: Date): string;

			time(val: Date): string;

			dateTime(val: Date): string;

			humanTime(val: Date): string;

			byte(val: number): string;

			integer(val: number): string;

			_getNumber(val: any): number;

			vunit(val: number, unit: string): string;
		}
	};

}

