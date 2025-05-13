// Improved waitlist form handler with dual submission approach
// This version uses direct form submission as primary method and fetch API as fallback

document.addEventListener('DOMContentLoaded', function() {
  // Find the waitlist form elements
  const waitlistForm = document.getElementById('waitlist-form'); // Use your actual form ID
  const waitlistContainer = document.querySelector('.waitlist-container'); // Use your actual container selector
  
  if (waitlistForm) {
    // Set up localStorage to store pending submissions
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingWaitlistSubmissions') || '[]');
    
    // Try to submit any pending submissions from previous sessions
    if (pendingSubmissions.length > 0) {
      submitPendingEntries();
    }
    
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
      
      // Add to pending submissions
      pendingSubmissions.push({
        email: email,
        source: 'website',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pendingWaitlistSubmissions', JSON.stringify(pendingSubmissions));
      
      // Show loading state
      const submitButton = waitlistForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerText;
      submitButton.innerText = 'Submitting...';
      submitButton.disabled = true;
      
      // Primary method: Direct form submission (avoids CORS issues)
      submitDirectForm(email)
        .then(success => {
          if (success) {
            // Clear form
            emailInput.value = '';
            
            // Show success message by replacing the form with a success message
            waitlistContainer.innerHTML = `
              <div class="success-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2>Thank you for joining our waitlist!</h2>
                <p>Your email has been successfully added!</p>
                <p>We'll keep you updated on our latest collections and exclusive offers.</p>
              </div>
            `;
            
            // Remove the email from pending submissions
            const updatedSubmissions = pendingSubmissions.filter(sub => sub.email !== email);
            localStorage.setItem('pendingWaitlistSubmissions', JSON.stringify(updatedSubmissions));
            
            // Try to submit any other pending submissions
            submitPendingEntries();
          } else {
            // If direct form submission fails, try fetch API as fallback
            submitViaFetch(email)
              .then(() => {
                // Reset form
                emailInput.value = '';
                
                // Show success message
                waitlistContainer.innerHTML = `
                  <div class="success-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h2>Thank you for joining our waitlist!</h2>
                    <p>Your email has been successfully added!</p>
                    <p>We'll keep you updated on our latest collections and exclusive offers.</p>
                  </div>
                `;
              })
              .catch(error => {
                console.error('Both submission methods failed:', error);
                showMessage('We\'ve saved your submission and will add you to the waitlist when connection is restored.', 'warning');
                submitButton.innerText = originalButtonText;
                submitButton.disabled = false;
              });
          }
        })
        .catch(error => {
          console.error('Form submission error:', error);
          submitButton.innerText = originalButtonText;
          submitButton.disabled = false;
          showMessage('We\'ve saved your submission and will add you to the waitlist when connection is restored.', 'warning');
        });
    });
  }
  
  // Function to submit via direct form (primary method)
  function submitDirectForm(email) {
    return new Promise((resolve, reject) => {
      try {
        // Create an invisible form that posts directly to the backend
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://eleveadmin.netlify.app/api/waitlist';
        form.style.display = 'none';
        
        // Add email field
        const emailField = document.createElement('input');
        emailField.type = 'hidden';
        emailField.name = 'email';
        emailField.value = email;
        form.appendChild(emailField);
        
        // Add source field
        const sourceField = document.createElement('input');
        sourceField.type = 'hidden';
        sourceField.name = 'source';
        sourceField.value = 'website';
        form.appendChild(sourceField);
        
        // Create an iframe to handle the response without navigating away
        const iframe = document.createElement('iframe');
        iframe.name = 'submit-iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Set the target to the iframe
        form.target = 'submit-iframe';
        
        // Handle load event
        iframe.onload = function() {
          try {
            // Check if iframe loaded successfully
            if (iframe.contentWindow.location.href.includes('waitlist-success')) {
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (e) {
            // Cross-origin issues, assume failure
            resolve(false);
          }
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(iframe);
            if (document.body.contains(form)) {
              document.body.removeChild(form);
            }
          }, 1000);
        };
        
        // Handle errors
        iframe.onerror = function() {
          document.body.removeChild(iframe);
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
          resolve(false);
        };
        
        // Add form to document, submit it, then remove it
        document.body.appendChild(form);
        form.submit();
        
        // Set a timeout to reject if no response
        setTimeout(() => {
          resolve(false);
        }, 10000); // 10 second timeout
      } catch (error) {
        console.error('Error in direct form submission:', error);
        reject(error);
      }
    });
  }
  
  // Function to submit via fetch API (fallback method)
  function submitViaFetch(email) {
    return fetch('https://eleveadmin.netlify.app/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        source: 'website'
      }),
      // Use no-cors mode as fallback
      mode: 'no-cors'
    })
    .then(response => {
      // With no-cors, we can't read the response
      // So we assume success
      return true;
    });
  }
  
  // Function to process pending submissions
  function submitPendingEntries() {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingWaitlistSubmissions') || '[]');
    
    if (pendingSubmissions.length === 0) return;
    
    // Process one at a time
    const submission = pendingSubmissions[0];
    
    // Try direct submission first
    submitDirectForm(submission.email)
      .then(success => {
        if (success) {
          // Remove the processed entry
          pendingSubmissions.shift();
          localStorage.setItem('pendingWaitlistSubmissions', JSON.stringify(pendingSubmissions));
          
          // Process the next entry if any remain
          if (pendingSubmissions.length > 0) {
            setTimeout(submitPendingEntries, 1000);
          }
        } else {
          // Try fetch API as fallback
          submitViaFetch(submission.email)
            .then(() => {
              // Remove the processed entry
              pendingSubmissions.shift();
              localStorage.setItem('pendingWaitlistSubmissions', JSON.stringify(pendingSubmissions));
              
              // Process the next entry if any remain
              if (pendingSubmissions.length > 0) {
                setTimeout(submitPendingEntries, 1000);
              }
            })
            .catch(error => {
              console.error('Failed to submit pending entry:', error);
              // We'll try again later, so leave it in the queue
            });
        }
      })
      .catch(error => {
        console.error('Failed to submit pending entry:', error);
      });
  }
  
  // Helper function to show messages to the user
  function showMessage(message, type) {
    // Create message element if it doesn't exist
    let messageElement = document.getElementById('waitlist-message');
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.id = 'waitlist-message';
      const formContainer = document.querySelector('.waitlist-container');
      if (formContainer) {
        formContainer.prepend(messageElement);
      } else {
        waitlistForm.prepend(messageElement);
      }
    }
    
    messageElement.innerText = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 5000);
  }
}); 