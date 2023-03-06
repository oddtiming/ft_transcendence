import { Routes, Route } from 'react-router-dom';
import Login from "./Login";
import WelcomeTest from './WelcomeTest';

const Views = () => {
	return <Routes>
		<Route path="/" element={<Login />} />
		<Route path="/welcome" element={<WelcomeTest />} />
		<Route path="*" element={<Login />} />
	</Routes>;
};

export default Views;