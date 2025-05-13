// This is a sample code snippet for your frontend website
// Add this to your website's JavaScript where the waitlist form is handled

document.addEventListener('DOMContentLoaded', function() {
  // Find the waitlist form on your page
  const waitlistForm = document.getElementById('waitlist-form'); // Use your actual form ID
  
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Get the email input value
      const emailInput = document.getElementById('email-input'); // Use your actual input ID
      const email = emailInput.value.trim();
      
      if (!email) {
        // Show error if email is empty
        showMessage('Please enter your email address', 'error');
        return;
      }
      
      // Show loading state
      const submitButton = waitlistForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerText;
      submitButton.innerText = 'Submitting...';
      submitButton.disabled = true;
      
      // Send to your admin backend API
      fetch('https://eleveadmin.netlify.app/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          source: 'website'
        })
      })
      .then(response => response.json())
      .then(data => {
        // Reset form
        emailInput.value = '';
        
        // Show success message
        if (data.message === 'Successfully added to waitlist' || data.exists) {
          // Redirect to success page or show success message
          window.location.href = '/waitlist-success';
          // Or show inline success message:
          // showMessage('Thank you for joining our waitlist!', 'success');
        } else {
          showMessage('Something went wrong. Please try again.', 'error');
        }
      })
      .catch(error => {
        console.error('Error submitting to waitlist:', error);
        showMessage('Failed to join waitlist. Please try again later.', 'error');
      })
      .finally(() => {
        // Reset button state
        submitButton.innerText = originalButtonText;
        submitButton.disabled = false;
      });
    });
  }
  
  // Helper function to show messages to the user
  function showMessage(message, type) {
    const messageElement = document.getElementById('waitlist-message');
    if (messageElement) {
      messageElement.innerText = message;
      messageElement.className = `message ${type}`;
      messageElement.style.display = 'block';
      
      // Hide message after 5 seconds
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 5000);
    } else {
      // Fallback to alert if no message element exists
      alert(message);
    }
  }
}); 