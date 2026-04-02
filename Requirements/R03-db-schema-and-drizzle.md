# R03 鏁版嵁搴?Schema 涓?Drizzle 鍒濆鍖?
- Status: done
- Phase: 2
- Depends on: R01

## Goal

寤虹珛 SQLite + Drizzle ORM 鏁版嵁灞傦紝骞朵弗鏍兼寜 PRD 瀹氫箟涓夊紶鏍稿績琛ㄣ€?
## Scope

- 閰嶇疆 SQLite 杩炴帴鍜?Drizzle 鍒濆鍖栥€?- 缂栧啓 `users`銆乣providers`銆乣api_keys` 涓夊紶琛ㄧ殑 schema銆?- 澶勭悊鍞竴绱㈠紩銆佸閿拰鏃堕棿瀛楁銆?- 鍑嗗杩佺Щ涓庡垵濮嬪寲鑴氭湰銆?
## Acceptance Criteria

- `users` 鍖呭惈 `id`, `username`, `password_hash`, `created_at`銆?- `providers` 浠呭寘鍚?`id`, `name`, `is_custom`锛屼笉寰楀嚭鐜?`icon` 瀛楁銆?- `api_keys` 鍖呭惈 `provider_id`, `name`, `api_key`, `base_url`, `notes`, `created_at`, `updated_at`銆?
