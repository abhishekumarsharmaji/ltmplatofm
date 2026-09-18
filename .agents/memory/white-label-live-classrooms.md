---
name: White-label live classrooms
description: Product boundary for live-class scheduling, classroom UX, authorization, attendance, and recordings.
---

Keep all live-class scheduling, rescheduling, authorization, course ownership, attendance, and classroom navigation inside the LMS. LiveKit supplies real-time audio, video, chat, and screen sharing but must not appear as an external meeting product or link. Live classes are course-specific broadcasts: the creator publishes media, enrolled students are subscribe-only viewers, and screen share takes priority in the student presentation.

**Why:** The product requires a fully white-label classroom, and external meeting links or third-party branding were explicitly rejected.

**How to apply:** Generate join tokens only on the server after ownership or enrollment checks. Grant publishing only to the owning creator/admin host and keep students subscribe-only. Prefer secure manual lesson-video upload after class until a supported LiveKit Egress storage destination is configured; never fake recording success.