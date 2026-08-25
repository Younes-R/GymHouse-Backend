ALTER TABLE "Session"
ADD CONSTRAINT valid_timeSlot_range CHECK(lower("timeSlot") < upper("timeSlot"));

ALTER TABLE "Session"
ADD CONSTRAINT no_overlapping_sessions
EXCLUDE USING Gist(
    "day" WITH =,
    "timeSlot" WITH &&
);