document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

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

  // Function to render activities
  async function renderActivities(activities) {
    const list = document.getElementById('activities-list');
    list.innerHTML = '';

    Object.entries(activities).forEach(([name, activity]) => {
      const card = document.createElement('div');
      card.className = 'activity-card';

      card.innerHTML = `
        <h4>${name}</h4>
        <p>${activity.description}</p>
        <p><strong>Schedule:</strong> ${activity.schedule}</p>
        <p><strong>Capacity:</strong> ${activity.participants.length}/${activity.max_participants}</p>
      `;

      // Participants section (pretty, bulleted list)
      const participantsSection = document.createElement('div');
      participantsSection.className = 'participants-section';

      const header = document.createElement('div');
      header.className = 'participant-header';

      const title = document.createElement('h5');
      title.textContent = 'Participants';
      header.appendChild(title);

      const count = document.createElement('span');
      count.className = 'participant-count';
      count.textContent = `${activity.participants.length} / ${activity.max_participants}`;
      header.appendChild(count);

      participantsSection.appendChild(header);

      if (!activity.participants || activity.participants.length === 0) {
        const none = document.createElement('p');
        none.className = 'info';
        none.textContent = 'No participants yet';
        participantsSection.appendChild(none);
      } else {
        const ul = document.createElement('ul');
        ul.className = 'participants-list';

        activity.participants.forEach(email => {
          const li = document.createElement('li');
          li.textContent = email;
          ul.appendChild(li);
        });

        participantsSection.appendChild(ul);
      }

      card.appendChild(participantsSection);
      list.appendChild(card);
    });
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
