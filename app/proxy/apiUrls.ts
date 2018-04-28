/**
 * @file
 * URLs for FFRK APIs
 */

const baseUrl = 'http://ffrk.denagames.com/dff/';

export const dungeons = (worldId: number) => `${baseUrl}world/dungeons?world_id=${worldId}`;
