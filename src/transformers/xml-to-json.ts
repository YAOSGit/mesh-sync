import type { Transformer } from '../types/Transformer/index.js';

interface XmlNode {
	[key: string]: unknown;
}

function parseXml(source: string): XmlNode {
	let pos = 0;
	const src = source.trim();

	function skipWhitespace(): void {
		while (pos < src.length && /\s/.test(src[pos])) pos++;
	}

	function parseAttributes(): Record<string, string> {
		const attrs: Record<string, string> = {};
		while (pos < src.length && src[pos] !== '>' && src[pos] !== '/') {
			skipWhitespace();
			if (src[pos] === '>' || src[pos] === '/') break;

			// Parse attribute name
			let name = '';
			while (
				pos < src.length &&
				src[pos] !== '=' &&
				src[pos] !== '>' &&
				src[pos] !== '/' &&
				!/\s/.test(src[pos])
			) {
				name += src[pos++];
			}
			if (!name) break;

			skipWhitespace();
			if (src[pos] !== '=') continue;
			pos++; // skip =
			skipWhitespace();

			// Parse attribute value
			const quote = src[pos];
			if (quote !== '"' && quote !== "'") continue;
			pos++; // skip opening quote
			let value = '';
			while (pos < src.length && src[pos] !== quote) {
				value += src[pos++];
			}
			pos++; // skip closing quote
			attrs[name] = value;
		}
		return attrs;
	}

	function parseElement(): XmlNode | string {
		skipWhitespace();

		if (pos >= src.length || src[pos] !== '<') {
			// Text content
			let text = '';
			while (pos < src.length && src[pos] !== '<') {
				text += src[pos++];
			}
			return text.trim();
		}

		// Skip XML declaration and comments
		if (src.slice(pos, pos + 5) === '<?xml') {
			pos = src.indexOf('?>', pos) + 2;
			skipWhitespace();
			return parseElement();
		}
		if (src.slice(pos, pos + 4) === '<!--') {
			pos = src.indexOf('-->', pos) + 3;
			skipWhitespace();
			return parseElement();
		}

		pos++; // skip <

		// Parse tag name
		let _tagName = '';
		while (
			pos < src.length &&
			src[pos] !== '>' &&
			src[pos] !== ' ' &&
			src[pos] !== '/'
		) {
			_tagName += src[pos++];
		}

		skipWhitespace();

		// Parse attributes
		const attrs = parseAttributes();

		skipWhitespace();

		// Self-closing tag
		if (src[pos] === '/') {
			pos++; // skip /
			pos++; // skip >
			const node: XmlNode = {};
			if (Object.keys(attrs).length > 0) {
				node['@attributes'] = attrs;
			}
			return node;
		}

		pos++; // skip >

		// Parse children
		const node: XmlNode = {};
		if (Object.keys(attrs).length > 0) {
			node['@attributes'] = attrs;
		}

		const children: Array<{ name: string; value: unknown }> = [];
		let textContent = '';

		while (pos < src.length) {
			skipWhitespace();

			// Check for closing tag
			if (src[pos] === '<' && src[pos + 1] === '/') {
				pos += 2; // skip </
				// Skip past closing tag name and >
				while (pos < src.length && src[pos] !== '>') pos++;
				pos++; // skip >
				break;
			}

			if (src[pos] === '<') {
				// Child element
				const savedPos = pos;
				pos++; // skip <
				let childName = '';
				while (
					pos < src.length &&
					src[pos] !== '>' &&
					src[pos] !== ' ' &&
					src[pos] !== '/'
				) {
					childName += src[pos++];
				}
				pos = savedPos; // reset to re-parse fully
				const child = parseElement();
				children.push({ name: childName, value: child });
			} else {
				// Text content
				while (pos < src.length && src[pos] !== '<') {
					textContent += src[pos++];
				}
			}
		}

		// Build node from children
		if (children.length === 0 && textContent.trim()) {
			node['#text'] = textContent.trim();
		} else {
			for (const child of children) {
				if (child.name in node) {
					const existing = node[child.name];
					if (Array.isArray(existing)) {
						existing.push(child.value);
					} else {
						node[child.name] = [existing, child.value];
					}
				} else {
					node[child.name] = child.value;
				}
			}
		}

		return node;
	}

	skipWhitespace();
	const root = parseElement();

	if (typeof root === 'string') {
		return { '#text': root };
	}

	return root as XmlNode;
}

const transform: Transformer = (source) => {
	const result = parseXml(source);
	return JSON.stringify(result, null, 2);
};
export default transform;
