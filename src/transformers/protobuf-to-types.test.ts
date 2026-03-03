import { describe, expect, it } from 'vitest';
import transform from './protobuf-to-types.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('protobuf-to-types transformer', () => {
	it('converts a simple message to a TypeScript type', () => {
		const input = `
syntax = "proto3";
package example;

message User {
  string name = 1;
  int32 age = 2;
  bool active = 3;
}`;
		const result = transform(input, ctx);
		expect(result).toContain('export type User = {');
		expect(result).toContain('name: string;');
		expect(result).toContain('age: number;');
		expect(result).toContain('active: boolean;');
	});

	it('handles repeated and optional fields', () => {
		const input = `
message Group {
  repeated string tags = 1;
  optional string description = 2;
}`;
		const result = transform(input, ctx);
		expect(result).toContain('tags: string[];');
		expect(result).toContain('description?: string | undefined;');
	});

	it('converts proto enums', () => {
		const input = `
enum Status {
  UNKNOWN = 0;
  ACTIVE = 1;
  INACTIVE = 2;
}`;
		const result = transform(input, ctx);
		expect(result).toContain('export enum Status {');
		expect(result).toContain('UNKNOWN = 0');
		expect(result).toContain('ACTIVE = 1');
		expect(result).toContain('INACTIVE = 2');
	});

	it('handles oneof fields as union types', () => {
		const input = `
message Event {
  string id = 1;
  oneof payload {
    string text = 2;
    int32 code = 3;
  }
}`;
		const result = transform(input, ctx);
		expect(result).toContain('id: string;');
		expect(result).toContain('payload: { text: string } | { code: number };');
	});

	it('handles bytes and comments', () => {
		const input = `
// A file message
message File {
  string name = 1;
  bytes content = 2; // file content
  /* size in bytes */
  int64 size = 3;
}`;
		const result = transform(input, ctx);
		expect(result).toContain('name: string;');
		expect(result).toContain('content: Uint8Array;');
		expect(result).toContain('size: number;');
	});
});
