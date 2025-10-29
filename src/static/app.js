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

      // Clear loading message and dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Render activity cards with participants
      renderActivities(activities);

      // Populate select dropdown
      Object.keys(activities).forEach((name) => {
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
          li.className = 'participant-item';

          const span = document.createElement('span');
          span.className = 'participant-email';
          span.textContent = email;

          const removeBtn = document.createElement('button');
          removeBtn.className = 'participant-remove';
          removeBtn.title = 'Unregister participant';
          // Show an icon and a clear "Delete" label for accessibility and clarity
          removeBtn.innerHTML = '<span class="remove-icon">&times;</span><span class="remove-text">Delete</span>';
          removeBtn.setAttribute('aria-label', `Remove ${email} from ${name}`);
          removeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Call DELETE endpoint to remove participant
            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const result = await res.json();
              if (res.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message success';
                messageDiv.classList.remove('hidden');
                // Refresh activities and dropdown
                await fetchActivities();
              } else {
                messageDiv.textContent = result.detail || 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
              }

              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'message error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            }
          });

          li.appendChild(span);
          li.appendChild(removeBtn);
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
        // use consistent classes so CSS matches other messages
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities so the newly-registered participant appears immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
