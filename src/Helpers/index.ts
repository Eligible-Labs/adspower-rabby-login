import { Wallet } from 'ethers';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const notExisting = (first: (string | number)[], second: (string | number)[]) => {
	const secondSet = new Set(second);

	return [...first.filter((value) => !secondSet.has(value))];
};

export const difference = (first: (string | number)[], second: (string | number)[]) => {
	const firstSet = new Set(first);
	const secondSet = new Set(second);

	return [...first.filter((value) => !secondSet.has(value)), ...second.filter((value) => !firstSet.has(value))];
};

const randomFloat = (min: number, max: number) => {
	const decimals = Math.max(min.toString().split('.')[1]?.length || 0, max.toString().split('.')[1]?.length || 0);

	const str = (Math.random() * (max - min) + min).toFixed(decimals);

	return Number.parseFloat(str);
};

export const randomInteger = (min: number, max: number): number => {
	return Math.floor(randomFloat(min, max));
};

export const validatePrivateKey = (privateKey: string) => {
	try {
		new Wallet(privateKey);
		return true;
	} catch {
		return false;
	}
};