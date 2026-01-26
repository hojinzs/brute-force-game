UPDATE blocks
SET difficulty_config = jsonb_build_object(
  'length', 6,
  'charset', jsonb_build_array('lowercase', 'alphanumeric')
)
WHERE difficulty_config IS NOT NULL;

COMMENT ON COLUMN blocks.difficulty_config IS 
'Format: {"length": 6, "charset": ["lowercase", "alphanumeric"]}. Charset options: lowercase, uppercase, alphanumeric, symbols';
