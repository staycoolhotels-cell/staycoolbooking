-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR TO ENABLE REALTIME

-- Enable real-time replication for the 'messages' table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
