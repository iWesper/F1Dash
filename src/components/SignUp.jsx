import "bootstrap/dist/css/bootstrap.min.css";
import { FcGoogle } from "react-icons/fc";
import { Button, FormGroup, Input, Label } from "reactstrap";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";

export const SignUp = ({ handleRegisterForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async () => {
    // Verificar se o email e password são válidos através de regex
    if (!/\S+@\S+\.\S+/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Verificar se a password tem pelo menos 6 caracteres
    if (password.length < 6) {
      alert("The password must be at least 6 characters long.");
      return;
    }

    try {
      await signUp(email, password);
      navigate("/"); // navigate depois de fazer register
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
      navigate("/"); // navigate depois de fazer login
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <FormGroup>
        <Label for="email">Email</Label>
        <Input
          type="email"
          name="email"
          id="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormGroup>
      <FormGroup>
        <Label for="password">Password</Label>
        <Input
          type="password"
          name="password"
          id="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Label for="confirmPassword">Confirm Password</Label>
        <Input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          placeholder="Confirm your password"
        />
      </FormGroup>
      <Button
        color="primary"
        onClick={() => handleSignUp(email, password)}
        className="mb-3"
      >
        Register
      </Button>
      <Button
        color="success"
        onClick={() => handleSignInWithGoogle()}
        className="mb-3"
      >
        {" "}
        <FcGoogle /> Sign In with Google{" "}
      </Button>
      <Button color="primary" onClick={handleRegisterForm} className="mb-3">
        I already have an account
      </Button>
    </div>
  );
};
