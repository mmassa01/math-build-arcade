import {mountDashboard} from './dashboard.mjs?v=54';
import {sampleAdapter} from './adapter.mjs';
mountDashboard(document,{adapter:sampleAdapter()});
