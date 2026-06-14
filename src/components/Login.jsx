import "bootstrap/dist/css/bootstrap.min.css";
import { FaGoogle } from "react-icons/fa";
import { Button, FormGroup, Input, Label } from "reactstrap";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";

export const Login = ({ handleRegisterForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signInWithGoogle, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
      navigate("/"); // navigate depois de fazer login
    } catch (error) {
      alert("Something went wrong. Please try again.");
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      navigate("/"); // navigate depois de fazer login
    } catch (error) {
      alert("Login failed. Please try again.");
      return;
    }
  };

  return (
    <div className="mt-5">
      <FormGroup>
        <Label for="email">Email</Label>
        <Input
          type="email"
          name="email"
          id="email"
          placeholder="example@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control form-control-user text-start shadow-sm"
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
          className="form-control form-control-user text-start shadow-sm"
        />{" "}
      </FormGroup>
      <Button
        color="none"
        onClick={() => handleSignIn(email, password)}
        className="my-3 btn-outline-light px-5"
      >
        Sign In
      </Button>
      <p class="w-100 text-center my-3">— Or Sign In With —</p>
      <div className="d-flex justify-content-center text-center my-4 pt-1">
        <FaGoogle className="fs-3" onClick={() => handleSignInWithGoogle()} style={{cursor: "pointer"}}/>
      </div>
      <p className="d-flex justify-content-center text-center">
        <div className="text-white-50">Don't have an account?</div>
        <Button
          color="none"
          onClick={handleRegisterForm}
          className="text-white py-0 border-0"
        >
          Sign Up
        </Button>
      </p>
    </div>
  );
};
