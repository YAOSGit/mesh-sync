import { describe, expect, it } from 'vitest';
import transform from './graphql-to-types.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('graphql-to-types transformer', () => {
	it('converts a simple type with required and optional fields', () => {
		const input = `
type User {
  id: ID!
  name: String!
  email: String
}`;
		const result = transform(input, ctx);
		expect(result).toContain('export type User = {');
		expect(result).toContain('id: string;');
		expect(result).toContain('name: string;');
		expect(result).toContain('email?: string;');
	});

	it('maps GraphQL scalars to TypeScript types', () => {
		const input = `
type Metrics {
  count: Int!
  score: Float!
  active: Boolean!
}`;
		const result = transform(input, ctx);
		expect(result).toContain('count: number;');
		expect(result).toContain('score: number;');
		expect(result).toContain('active: boolean;');
	});

	it('converts list types to arrays', () => {
		const input = `
type Group {
  members: [String!]!
  tags: [String]
}`;
		const result = transform(input, ctx);
		expect(result).toContain('members: string[];');
		expect(result).toContain('tags?: string[];');
	});

	it('converts enums', () => {
		const input = `
enum Status {
  ACTIVE
  INACTIVE
  PENDING
}`;
		const result = transform(input, ctx);
		expect(result).toContain('export enum Status {');
		expect(result).toContain("ACTIVE = 'ACTIVE'");
		expect(result).toContain("INACTIVE = 'INACTIVE'");
		expect(result).toContain("PENDING = 'PENDING'");
	});

	it('converts scalar declarations and input types', () => {
		const input = `
scalar DateTime

input CreateUserInput {
  name: String!
  birthDate: DateTime
}`;
		const result = transform(input, ctx);
		expect(result).toContain('export type DateTime = string;');
		expect(result).toContain('export type CreateUserInput = {');
		expect(result).toContain('name: string;');
		expect(result).toContain('birthDate?: DateTime;');
	});
});
