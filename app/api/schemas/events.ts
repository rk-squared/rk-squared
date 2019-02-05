import { NumberAsString, RelativeUrlPath } from './common';

export interface GetIntroDataPost {
  // This apparently corresponds to a template ID from js/templates.js, and not
  // to the event ID itself.
  event_id: NumberAsString;
}

// Sample URL: http://ffrk.denagames.com/dff/event/get_intro_data
export interface GetIntroData {
  intro_prize_master_list:
    | {}
    | Array<{
        disp_order: number;
        event_id: number;
        prize_id: number;
        item_image_path: RelativeUrlPath;
        item_name: string;
      }>;
  intro_text_master_map: {
    [id: string]: string;
  };
  brave_series_bonus_buddies: Array<{
    release_id: number;
    name: string;
    series_id: number;
    description: string;
    dress_record_name: string;
    image_path: RelativeUrlPath;
    role_type_name: string;
    job_name: string;
    id: number;
    role_type: number;
  }>;
}
