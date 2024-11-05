/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global window, document */

import { describe, it, expect } from 'vitest';
import global from '../../src/dom/global.ts';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils.js';

describe( 'global', () => {
	testUtils.createSinonSandbox();

	describe( 'global', () => {
		describe( 'window', () => {
			it( 'equals native DOM window', () => {
				expect( global.window ).to.equal( window );
			} );

			it( 'stubs', () => {
				testUtils.sinon.stub( global, 'window' ).value( {
					scrollX: 100
				} );

				expect( global.window ).to.deep.equal( {
					scrollX: 100
				} );
			} );
		} );

		describe( 'document', () => {
			it( 'equals native DOM document', () => {
				expect( global.document ).to.equal( document );
			} );

			it( 'stubs', () => {
				testUtils.sinon.stub( global, 'document' ).value( {
					foo: 'abc'
				} );

				expect( global.document ).to.deep.equal( {
					foo: 'abc'
				} );
			} );
		} );
	} );
} );
