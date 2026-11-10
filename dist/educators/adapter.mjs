import {validate} from './model.mjs';
import {createSampleData} from './sample-data.mjs';
/** Host contract: {load({signal}): Promise<ReportingDataset>}. Read-only.
 * Production host must enforce tenant, school and roster authorization server-side.
 * UI role buttons are preview navigation, never access controls.
 */
export function sampleAdapter(){return {async load({signal}={}){if(signal?.aborted)throw new DOMException('Aborted','AbortError');return validate(createSampleData());}};}
export function httpAdapter(endpoint){const url=new URL(endpoint,location.href);if(url.origin!==location.origin)throw new Error('Reporting endpoint must be same-origin');return {async load({signal}={}){const response=await fetch(url,{signal,credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Reporting request failed (${response.status})`);return validate(await response.json());}};}
