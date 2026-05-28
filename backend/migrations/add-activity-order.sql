-- Add order field to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS `order` INT DEFAULT 0 COMMENT 'Display order for activities in the same project/parent';

-- Create index for efficient sorting
ALTER TABLE activities ADD INDEX idx_project_order (projectId, parentActivityId, `order`);

-- Update existing activities to have sequential order based on creation time
SET @row_number := 0;
SET @current_project := NULL;
SET @current_parent := NULL;

UPDATE activities a
JOIN (
  SELECT 
    id,
    @row_number := IF(@current_project = projectId AND @current_parent = IFNULL(parentActivityId, 0), 
                      @row_number + 1, 1) as new_order,
    @current_project := projectId,
    @current_parent := IFNULL(parentActivityId, 0)
  FROM activities
  ORDER BY projectId, IFNULL(parentActivityId, 0), createdAt
) temp ON a.id = temp.id
SET a.`order` = temp.new_order;
