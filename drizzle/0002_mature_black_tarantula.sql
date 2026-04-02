ALTER TABLE `providers` ADD `base_url` text;--> statement-breakpoint
WITH ranked_provider_base_urls AS (
  SELECT
    provider_id,
    TRIM(base_url) AS normalized_base_url,
    COUNT(*) AS usage_count,
    MAX(updated_at) AS latest_updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY provider_id
      ORDER BY COUNT(*) DESC, MAX(updated_at) DESC, TRIM(base_url) ASC
    ) AS row_index
  FROM api_keys
  WHERE base_url IS NOT NULL AND TRIM(base_url) <> ''
  GROUP BY provider_id, TRIM(base_url)
)
UPDATE providers
SET base_url = (
  SELECT ranked_provider_base_urls.normalized_base_url
  FROM ranked_provider_base_urls
  WHERE ranked_provider_base_urls.provider_id = providers.id
    AND ranked_provider_base_urls.row_index = 1
)
WHERE (providers.base_url IS NULL OR TRIM(providers.base_url) = '')
  AND EXISTS (
    SELECT 1
    FROM ranked_provider_base_urls
    WHERE ranked_provider_base_urls.provider_id = providers.id
      AND ranked_provider_base_urls.row_index = 1
  );--> statement-breakpoint
ALTER TABLE `api_keys` DROP COLUMN `base_url`;
