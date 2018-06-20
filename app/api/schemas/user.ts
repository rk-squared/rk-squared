export interface User {
  stamina_piece: number;
  soul_piece: number;
  residual_stamina_piece: number;
  start_time_of_today: number;
  stamina_recovery_time: number;
  max_followee_num: number;
  dungeon_id: number;
  id: number;
  release_id: number;
  stamina_info: {
    additional_stamina: number;
    current_max_stamina: number;
    prev_max_stamina: number;
    got_stamina_piece: number;
  };
  func_tutorial_flags: {
    [s: string]: boolean;
  };
  name: string;
  has_all_clear_ver_to_show: false;
  stamina: number;
  can_review: true;
  tutorial_step: number;
  followee_num: number;
  stamina_recovery_remaining_time: number;
  gil: number;
  is_update_last_logined_at: false;
  last_logined_at: number;
  max_follower_num: number;
  max_stamina: number;
}
