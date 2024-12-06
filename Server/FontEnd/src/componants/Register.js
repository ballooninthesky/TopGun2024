import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ipData } from './Ip';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
    
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match!");
            setSuccessMessage('');
            return;
        }
    
        const data = { email, password };
    
        try {
            const response = await fetch(`http://${ipData}:5000/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
    
            if (response.ok) {
                const result = await response.json();
                if (result.message === 'Registration Successful') {
                    setSuccessMessage("Registration successful!");
                    setErrorMessage('');
                    setTimeout(() => {
                        navigate('/login'); // Redirect to login after successful registration
                    }, 2000);
                } else {
                    setErrorMessage('Registration failed! Please try again.');
                    setSuccessMessage('');
                }
            } else {
                throw new Error('Registration failed');
            }
        } catch (error) {
            setErrorMessage(error.message || 'An error occurred. Please try again later.');
            setSuccessMessage('');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h1 style={styles.header}>Register</h1>
                <form onSubmit={handleRegister}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email:</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password:</label>
                        <input
                            type="password"
                            style={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Confirm Password:</label>
                        <input
                            type="password"
                            style={styles.input}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" style={styles.button}>Register</button>
                </form>

                {errorMessage && <p style={{ ...styles.message, ...styles.error }}>{errorMessage}</p>}
                {successMessage && <p style={{ ...styles.message, ...styles.success }}>{successMessage}</p>}

                <p style={styles.loginLink}>
                    Already have an account? <Link to="/login" style={styles.link}>Login</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
    },
    formContainer: {
        width: '100%',
        maxWidth: '350px',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    header: {
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333',
    },
    inputGroup: {
        width: '100%',
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontSize: '14px',
        color: '#555',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '16px',
        transition: 'border-color 0.3s',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#2F5559',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.3s, transform 0.2s',
    },
    buttonHover: {
        backgroundColor: '#3a6b6f',
    },
    message: {
        textAlign: 'center',
        fontSize: '14px',
        marginTop: '10px',
    },
    error: {
        color: 'red',
    },
    success: {
        color: 'green',
    },
    loginLink: {
        textAlign: 'center',
        marginTop: '15px',
        fontSize: '14px',
        color: '#555',
    },
    link: {
        color: '#2F5559',
        textDecoration: 'none',
    }
};

export default Register;
