/** Convert a Celsius temperature to Fahrenheit. */
export function celsiusToFahrenheit(celsius: number): number {
	return celsius * (9 / 5) - 32;
}

/** Convert a Fahrenheit temperature to Celsius. */
export function fahrenheitToCelsius(fahrenheit: number): number {
	return ((fahrenheit - 32) * 5) / 9;
}
