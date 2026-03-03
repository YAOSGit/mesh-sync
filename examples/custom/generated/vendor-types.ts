export namespace Vendor {
	export type User = {
		id: string;
		name: string;
		email: string;
	};

	export type Product = {
		sku: string;
		name: string;
		price: number;
		currency: string;
	};

	export type Order = {
		orderId: string;
		userId: string;
		items: Array<{ sku: string; quantity: number }>;
		total: number;
	};
}
