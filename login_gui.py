import json
import customtkinter as ctk
from tkinter import messagebox

# Function to save credentials to a file
def save_credentials(email_phone, password):
    credentials = {
        "email_phone": email_phone,
        "password": password
    }
    
    # Write credentials to the file
    with open('credentials.json', 'w') as file:
        json.dump(credentials, file, indent=4)

    print("Credentials saved.")

# Callback function when user submits the form
def on_login():
    email_phone = entry_email_phone.get()
    password = entry_password.get()

    # Validate that both fields are filled
    if not email_phone or not password:
        # Show an error message box if inputs are empty
        messagebox.showerror("Input Error", "Please enter both email/phone and password.")
        return

    # Save credentials to file
    save_credentials(email_phone, password)

    # After saving, run the main app (app.py)
    messagebox.showinfo("Success", "Credentials saved. Click OK to proceed...")
    root.quit()  # Close the login window after launching app


# Create the tkinter window for login
root = ctk.CTk()

root.title("@https://github.com/joelblr/WST-AZON")
root.geometry("400x250")

# Set the background color of the main window (not the labels)
root.configure(fg_color="#2C3E50")  # Dark Blue Background for the main window

# Define a color that complements the blue background (light cyan)
text_color = "#A3D0D4"  # Light Cyan

root.grid_columnconfigure(0, weight=1)  # Column 0 will resize
root.grid_columnconfigure(1, weight=3)  # Column 1 (input fields) will take more space

# Create a header label
header_label = ctk.CTkLabel(root, text="Amazon Login Form", font=("Helvetica", 20, "bold"), text_color=text_color)
header_label.grid(row=0, columnspan=2, pady=20)


# Create and place the form widgets using grid
label_email_phone = ctk.CTkLabel(root, text="Email or Phone:", font=("Helvetica", 14, "bold"), text_color=text_color)
label_email_phone.grid(row=1, column=0, pady=10, padx=20, sticky="w")

entry_email_phone = ctk.CTkEntry(root)
entry_email_phone.grid(row=1, column=1, pady=10, padx=20, sticky="ew")  # Make it fill the horizontal space

label_password = ctk.CTkLabel(root, text="Password:", font=("Helvetica", 14, "bold"), text_color=text_color)
label_password.grid(row=2, column=0, pady=10, padx=20, sticky="w")

entry_password = ctk.CTkEntry(root, show="*")  # Hide password text
entry_password.grid(row=2, column=1, pady=10, padx=20, sticky="ew")  # Make it fill the horizontal space

# Login Button
login_button = ctk.CTkButton(root, text="Login" , font=("Helvetica", 16, "bold"), fg_color="#2980B9", text_color="white", command=on_login)
login_button.grid(row=3, column=0, columnspan=2, pady=20)

# Run the application
root.mainloop()
