// @ts-expect-error — virtual module
import addBannerSource from 'builtin-transformer:add-banner';
// @ts-expect-error — virtual module
import addEslintDisableSource from 'builtin-transformer:add-eslint-disable';
// @ts-expect-error — virtual module
import asyncapiToTypesSource from 'builtin-transformer:asyncapi-to-types';
// @ts-expect-error — virtual module
import changelogLatestSource from 'builtin-transformer:changelog-latest';
// @ts-expect-error — virtual module
import cjsToEsmSource from 'builtin-transformer:cjs-to-esm';
// @ts-expect-error — virtual module
import csvToJsonSource from 'builtin-transformer:csv-to-json';
// @ts-expect-error — virtual module
import dedupeLinesSource from 'builtin-transformer:dedupe-lines';
// @ts-expect-error — virtual module
import dotenvToDockerSource from 'builtin-transformer:dotenv-to-docker';
// Batch 5: Infrastructure / Config
// @ts-expect-error — virtual module
import envFilterSource from 'builtin-transformer:env-filter';
// @ts-expect-error — virtual module
import envToTsSource from 'builtin-transformer:env-to-ts';
// @ts-expect-error — virtual module
import extractTypesSource from 'builtin-transformer:extract-types';
// Batch 3: API Contract Transformers
// @ts-expect-error — virtual module
import graphqlToTypesSource from 'builtin-transformer:graphql-to-types';
// @ts-expect-error — virtual module
import hashValuesSource from 'builtin-transformer:hash-values';
// @ts-expect-error — virtual module
import headSource from 'builtin-transformer:head';
// @ts-expect-error — virtual module
import jsonFlattenSource from 'builtin-transformer:json-flatten';
// @ts-expect-error — virtual module
import jsonMergeSource from 'builtin-transformer:json-merge';
// @ts-expect-error — virtual module
import jsonOmitSource from 'builtin-transformer:json-omit';
// @ts-expect-error — virtual module
import jsonPickSource from 'builtin-transformer:json-pick';
// @ts-expect-error — virtual module
import jsonSchemaToTypesSource from 'builtin-transformer:json-schema-to-types';
// @ts-expect-error — virtual module
import jsonToEnvSource from 'builtin-transformer:json-to-env';
// @ts-expect-error — virtual module
import jsonToTsSource from 'builtin-transformer:json-to-ts';
// @ts-expect-error — virtual module
import jsonToYamlSource from 'builtin-transformer:json-to-yaml';
// @ts-expect-error — virtual module
import jsonToZodSource from 'builtin-transformer:json-to-zod';
// @ts-expect-error — virtual module
import keepExportedSource from 'builtin-transformer:keep-exported';
// Batch 8: Documentation / Markdown
// @ts-expect-error — virtual module
import markdownExtractSectionSource from 'builtin-transformer:markdown-extract-section';
// @ts-expect-error — virtual module
import markdownRewriteLinksSource from 'builtin-transformer:markdown-rewrite-links';
// @ts-expect-error — virtual module
import markdownStripBadgesSource from 'builtin-transformer:markdown-strip-badges';
// @ts-expect-error — virtual module
import markdownToHtmlSource from 'builtin-transformer:markdown-to-html';
// @ts-expect-error — virtual module
import markdownToPlaintextSource from 'builtin-transformer:markdown-to-plaintext';
// @ts-expect-error — virtual module
import markdownTocSource from 'builtin-transformer:markdown-toc';
// @ts-expect-error — virtual module
import maskEmailsSource from 'builtin-transformer:mask-emails';
// @ts-expect-error — virtual module
import minifySource from 'builtin-transformer:minify';
// @ts-expect-error — virtual module
import openapiToFetchSource from 'builtin-transformer:openapi-to-fetch';
// @ts-expect-error — virtual module
import openapiToMockSource from 'builtin-transformer:openapi-to-mock';
// @ts-expect-error — virtual module
import openapiToRoutesSource from 'builtin-transformer:openapi-to-routes';
// @ts-expect-error — virtual module
import openapiToTypesSource from 'builtin-transformer:openapi-to-types';
// @ts-expect-error — virtual module
import passthroughSource from 'builtin-transformer:passthrough';
// @ts-expect-error — virtual module
import prettifyJsonSource from 'builtin-transformer:prettify-json';
// @ts-expect-error — virtual module
import protobufToTypesSource from 'builtin-transformer:protobuf-to-types';
// @ts-expect-error — virtual module
import redactKeysSource from 'builtin-transformer:redact-keys';
// Batch 7: Security / Sanitization
// @ts-expect-error — virtual module
import redactSecretsSource from 'builtin-transformer:redact-secrets';
// @ts-expect-error — virtual module
import renameExportsSource from 'builtin-transformer:rename-exports';
// @ts-expect-error — virtual module
import replaceSource from 'builtin-transformer:replace';
// @ts-expect-error — virtual module
import sliceSource from 'builtin-transformer:slice';
// @ts-expect-error — virtual module
import sortLinesSource from 'builtin-transformer:sort-lines';
// @ts-expect-error — virtual module
import stripCommentsSource from 'builtin-transformer:strip-comments';
// @ts-expect-error — virtual module
import stripEnvValuesSource from 'builtin-transformer:strip-env-values';
// Batch 1: Content Filters
// @ts-expect-error — virtual module
import stripExportsSource from 'builtin-transformer:strip-exports';
// @ts-expect-error — virtual module
import stripImportsSource from 'builtin-transformer:strip-imports';
// @ts-expect-error — virtual module
import stripJsdocSource from 'builtin-transformer:strip-jsdoc';
// @ts-expect-error — virtual module
import stripTestsSource from 'builtin-transformer:strip-tests';
// @ts-expect-error — virtual module
import tailSource from 'builtin-transformer:tail';
// @ts-expect-error — virtual module
import templateSource from 'builtin-transformer:template';
// @ts-expect-error — virtual module
import tomlToJsonSource from 'builtin-transformer:toml-to-json';
// Batch 6: Content Processing
// @ts-expect-error — virtual module
import truncateSource from 'builtin-transformer:truncate';
// @ts-expect-error — virtual module
import validateNoSecretsSource from 'builtin-transformer:validate-no-secrets';
// @ts-expect-error — virtual module
import wrapSource from 'builtin-transformer:wrap';
// @ts-expect-error — virtual module
import wrapModuleSource from 'builtin-transformer:wrap-module';
// @ts-expect-error — virtual module
import wrapNamespaceSource from 'builtin-transformer:wrap-namespace';
// @ts-expect-error — virtual module
import xmlToJsonSource from 'builtin-transformer:xml-to-json';
// Batch 2: Format Converters
// @ts-expect-error — virtual module
import yamlToJsonSource from 'builtin-transformer:yaml-to-json';

const BUILTIN_SOURCES: Record<string, string> = {
	passthrough: passthroughSource,
	'strip-comments': stripCommentsSource,
	'json-to-ts': jsonToTsSource,
	'openapi-to-types': openapiToTypesSource,

	// Content Filters
	'strip-exports': stripExportsSource,
	'extract-types': extractTypesSource,
	'strip-tests': stripTestsSource,
	'strip-imports': stripImportsSource,
	'strip-jsdoc': stripJsdocSource,
	'keep-exported': keepExportedSource,

	// Format Converters
	'yaml-to-json': yamlToJsonSource,
	'json-to-yaml': jsonToYamlSource,
	'toml-to-json': tomlToJsonSource,
	'env-to-ts': envToTsSource,
	'json-to-zod': jsonToZodSource,
	'csv-to-json': csvToJsonSource,
	'markdown-to-html': markdownToHtmlSource,
	'xml-to-json': xmlToJsonSource,
	'json-to-env': jsonToEnvSource,

	// API Contract Transformers
	'graphql-to-types': graphqlToTypesSource,
	'protobuf-to-types': protobufToTypesSource,
	'json-schema-to-types': jsonSchemaToTypesSource,
	'openapi-to-routes': openapiToRoutesSource,
	'openapi-to-mock': openapiToMockSource,
	'openapi-to-fetch': openapiToFetchSource,
	'asyncapi-to-types': asyncapiToTypesSource,

	// Code Transformers
	'add-banner': addBannerSource,
	'wrap-namespace': wrapNamespaceSource,
	'wrap-module': wrapModuleSource,
	'rename-exports': renameExportsSource,
	minify: minifySource,
	'prettify-json': prettifyJsonSource,
	'cjs-to-esm': cjsToEsmSource,
	'add-eslint-disable': addEslintDisableSource,

	// Infrastructure / Config
	'env-filter': envFilterSource,
	'json-pick': jsonPickSource,
	'json-merge': jsonMergeSource,
	template: templateSource,
	'dotenv-to-docker': dotenvToDockerSource,
	'json-omit': jsonOmitSource,
	'json-flatten': jsonFlattenSource,

	// Content Processing
	truncate: truncateSource,
	slice: sliceSource,
	'sort-lines': sortLinesSource,
	'dedupe-lines': dedupeLinesSource,
	replace: replaceSource,
	head: headSource,
	tail: tailSource,
	wrap: wrapSource,

	// Security / Sanitization
	'redact-secrets': redactSecretsSource,
	'redact-keys': redactKeysSource,
	'strip-env-values': stripEnvValuesSource,
	'mask-emails': maskEmailsSource,
	'hash-values': hashValuesSource,
	'validate-no-secrets': validateNoSecretsSource,

	// Documentation / Markdown
	'markdown-extract-section': markdownExtractSectionSource,
	'markdown-toc': markdownTocSource,
	'markdown-strip-badges': markdownStripBadgesSource,
	'markdown-to-plaintext': markdownToPlaintextSource,
	'markdown-rewrite-links': markdownRewriteLinksSource,
	'changelog-latest': changelogLatestSource,
};

export function isBuiltinId(id: string): boolean {
	return id in BUILTIN_SOURCES;
}

export function getBuiltinTransformerSource(id: string): string {
	const source = BUILTIN_SOURCES[id];
	if (!source) {
		throw new Error(`Unknown built-in transformer: "${id}"`);
	}
	return source;
}
