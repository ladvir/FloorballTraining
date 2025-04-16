// js/sidebarActivities.js
import { appState } from './state.js';
import { DEFAULT_ACTIVITIES } from './config.js';
import { dom } from './dom.js';
import { createGhostPreview } from './dragDrop.js'; // Needs ghost creation logic

/** Loads activities from localStorage or defaults, populating the sidebar. */
export function loadActivities() {
    dom.activityList.querySelectorAll('.activity-item').forEach(item => item.remove());

    let storedActivities = localStorage.getItem("activities");
    let parsedActivities = null;
    if (storedActivities) {
        try {
            parsedActivities = JSON.parse(storedActivities);
            if (!Array.isArray(parsedActivities)) {
                console.warn("Stored activities data is not an array. Using defaults.");
                parsedActivities = null;
            }
            // Add basic validation for title/description existence if needed during load
            parsedActivities = parsedActivities?.map(act => ({
                ...act,
                title: act.title ?? act.name ?? `Activity ${act.id}`, // Add default title if missing
                description: act.description ?? "" // Add default description if missing
            }));
        } catch (e) {
            console.error("Error parsing stored activities:", e, "Using defaults.");
            parsedActivities = null;
        }
    }

    // Use defaults if parsing failed or no stored data, ensuring title/desc exist
    if (!parsedActivities) {
        parsedActivities = DEFAULT_ACTIVITIES.map(act => ({
            ...act,
            title: act.title ?? act.name ?? `Activity ${act.id}`,
            description: act.description ?? ""
        }));
    }


    appState.activities = parsedActivities;
    // Save back potentially corrected/defaulted data
    localStorage.setItem("activities", JSON.stringify(appState.activities));

    // Populate UI
    appState.activities.forEach((activity, index) => {
        // Check for core properties + title/description
        if (activity && activity.id != null && typeof activity.name === 'string' && typeof activity.svg === 'string' && typeof activity.title === 'string' && typeof activity.description === 'string') {
            const item = document.createElement("div");
            item.className = "sidebar-item-base activity-item";
            item.textContent = activity.name; // Show name in sidebar
            item.draggable = true;
            item.dataset.activityId = String(activity.id);
            item.addEventListener("dragstart", handleActivityDragStart);
            dom.activityList.appendChild(item);
        } else {
            console.warn(`Skipping invalid activity item at index ${index}:`, activity);
        }
    });
}


/** Sets up dataTransfer and ghost preview for dragging an activity item. */
export function handleActivityDragStart(event) {
    const activityId = event.target.dataset.activityId || "";
    const activity = appState.activities.find(a => String(a.id) === activityId);

    if (activity) {
        event.dataTransfer.setData("text/plain", activityId); // Pass ID
        event.dataTransfer.setData("application/source", "activity");
        event.dataTransfer.effectAllowed = "copy";

        appState.currentDraggingItemInfo = {
            type: 'activity',
            id: activity.id,
            width: 120, // Default ghost size, can be adjusted
            height: 80,
            svgContent: activity.svg,
            name: activity.name, // Keep original name for potential use
            title: activity.title, // Add title
            description: activity.description // Add description
        };
        createGhostPreview(event); // Function from dragDrop.js
    } else {
        console.error("Could not find activity data for ID:", activityId);
        event.preventDefault();
    }
}