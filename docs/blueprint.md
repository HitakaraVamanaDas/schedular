# **App Name**: MetroSchedule

## Core Features:

- Event Timeline: Displays a scrollable list of scheduled events categorized by time proximity (e.g., 'Coming', 'This Week', 'Later').
- Pivot Navigation: Uses a horizontal 'Pivot' control for navigating between different schedule views or filters (e.g., 'Coming', 'Repeat daily', 'Repeat weekly', 'Repeat monthly')
- Swipe Interaction: Offers a swipe-based user experience with parallax scrolling effect on the pivot titles.
- Event Details: Displays essential event information like time, title, and a brief content preview. Uses simple toggle controls for enabling/disabling notifications.
- Event Deletion: Enables users to delete events from the schedule directly from the main view.
- Set reminders: Allows users to set event reminders. It stores the data locally.
- Smart title: Uses an AI tool that can suggest the event name by analysing the date or the content description.

## Style Guidelines:

- Primary color: #26A96A (a desaturated green) for representing growth and reliability.
- Background color: #F5F5F5 (very light gray) for a clean, minimalist look.
- Accent color: #3F51B5 (a deeper purple, ~30 degrees anticlockwise from the primary on the color wheel) to highlight active elements and interactive components.
- Body and headline font: 'PT Sans' (a humanist sans-serif).
- Use simple, line-art icons from lucide-react for visual cues.
- Employ a minimalist design with generous white space, prioritizing content over chrome. Replicate the 'Pivot' and 'Panorama' controls from Windows Phone.
- Implement fluid swiping transitions and a parallax scrolling effect on the pivot titles.