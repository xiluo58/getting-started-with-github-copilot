document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function renderParticipants(section, activityName, details, activityCard) {
    section.replaceChildren();

    const participantsHeading = document.createElement("h5");
    participantsHeading.textContent = "Participants";
    section.appendChild(participantsHeading);

    if (details.participants.length > 0) {
      const participantsList = document.createElement("ul");
      details.participants.forEach((participant) => {
        const participantItem = document.createElement("li");
        participantItem.className = "participant-item";

        const participantName = document.createElement("span");
        participantName.className = "participant-name";
        participantName.textContent = participant;
        participantItem.appendChild(participantName);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "participant-remove";
        removeButton.setAttribute("aria-label", `Remove ${participant} from ${activityName}`);
        removeButton.title = "Remove participant";

        const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        deleteIcon.setAttribute("viewBox", "0 0 24 24");
        deleteIcon.setAttribute("aria-hidden", "true");
        const deletePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        deletePath.setAttribute(
          "d",
          "M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm3 2v8h2v-8H9zm4 0v8h2v-8h-2z"
        );
        deleteIcon.appendChild(deletePath);
        removeButton.appendChild(deleteIcon);

        removeButton.addEventListener("click", async () => {
          removeButton.disabled = true;
          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(participant)}`,
              { method: "DELETE" }
            );
            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.detail || "Failed to remove participant");
            }

            const participantIndex = details.participants.indexOf(participant);
            if (participantIndex !== -1) {
              details.participants.splice(participantIndex, 1);
            }

            activityCard.querySelector(".availability-count").textContent =
              `${details.max_participants - details.participants.length} spots left`;
            renderParticipants(section, activityName, details, activityCard);

            messageDiv.textContent = result.message;
            messageDiv.className = "success";
            messageDiv.classList.remove("hidden");
            setTimeout(() => messageDiv.classList.add("hidden"), 5000);
          } catch (error) {
            messageDiv.textContent = error.message || "Failed to remove participant. Please try again.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            removeButton.disabled = false;
            console.error("Error removing participant:", error);
          }
        });

        participantItem.appendChild(removeButton);
        participantsList.appendChild(participantItem);
      });
      section.appendChild(participantsList);
    } else {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "participants-empty";
      emptyMessage.textContent = "No participants yet";
      section.appendChild(emptyMessage);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability-count">${spotsLeft} spots left</span></p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";
        renderParticipants(participantsSection, name, details, activityCard);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
