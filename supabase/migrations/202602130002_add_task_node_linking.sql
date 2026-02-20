-- Add node linking fields so imported tasks can map to canvas nodes

ALTER TABLE public.task_items
ADD COLUMN IF NOT EXISTS node_id TEXT,
ADD COLUMN IF NOT EXISTS node_type TEXT,
ADD COLUMN IF NOT EXISTS link_confidence DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_task_items_project_node
  ON public.task_items(project_id, node_id);
