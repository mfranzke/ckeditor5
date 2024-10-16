/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals Event, document */

import LinkFormView from '../../src/ui/linkformview.js';
import View from '@ckeditor/ckeditor5-ui/src/view.js';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard.js';
import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler.js';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker.js';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler.js';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection.js';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils.js';
import ManualDecorator from '../../src/utils/manualdecorator.js';
import Collection from '@ckeditor/ckeditor5-utils/src/collection.js';
import { add as addTranslations, _clear as clearTranslations } from '@ckeditor/ckeditor5-utils/src/translation-service.js';
import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor.js';
import Link from '../../src/link.js';
import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

describe( 'LinkFormView', () => {
	let view;

	testUtils.createSinonSandbox();

	beforeEach( () => {
		view = new LinkFormView( { t: val => val }, { manualDecorators: [] } );
		view.render();
		document.body.appendChild( view.element );
	} );

	afterEach( () => {
		view.element.remove();
		view.destroy();
	} );

	describe( 'constructor()', () => {
		it( 'should create element from template', () => {
			expect( view.element.classList.contains( 'ck' ) ).to.true;
			expect( view.element.classList.contains( 'ck-link__panel' ) ).to.true;
		} );

		it( 'should create child views', () => {
			expect( view.backButton ).to.be.instanceOf( View );
			expect( view.settingsButton ).to.be.instanceOf( View );
			expect( view.bookmarksButton ).to.be.instanceOf( View );
			expect( view.saveButtonView ).to.be.instanceOf( View );
			expect( view.displayedTextInputView ).to.be.instanceOf( View );
			expect( view.urlInputView ).to.be.instanceOf( View );
		} );

		it( 'should create #focusTracker instance', () => {
			expect( view.focusTracker ).to.be.instanceOf( FocusTracker );
		} );

		it( 'should create #keystrokes instance', () => {
			expect( view.keystrokes ).to.be.instanceOf( KeystrokeHandler );
		} );

		it( 'should create #_focusCycler instance', () => {
			expect( view._focusCycler ).to.be.instanceOf( FocusCycler );
		} );

		it( 'should create #_focusables view collection', () => {
			expect( view._focusables ).to.be.instanceOf( ViewCollection );
		} );

		it( 'should fire `cancel` event on backButton#execute', () => {
			const spy = sinon.spy();

			view.on( 'cancel', spy );

			view.backButton.fire( 'execute' );

			expect( spy.calledOnce ).to.true;
		} );

		it( 'should create url input with inputmode=url', () => {
			expect( view.urlInputView.fieldView.inputMode ).to.be.equal( 'url' );
		} );

		describe( 'template', () => {
			/**
				 * div
				 * 	header
				 * 		backButton
				 * 		...
				 * 		settingsButton
				 * 	form
				 * 		displayedTextInputView
				 * 		div
				 * 			urlInputView
				 * 			saveButton
				 * 	bookmarksButton
				 */

			it( 'has url input view', () => {
				const formChildren = view.template.children[ 1 ].template.children[ 0 ];

				expect( formChildren.get( 0 ) ).to.equal( view.displayedTextInputView );
				expect( formChildren.get( 1 ).template.children[ 0 ] ).to.equal( view.urlInputView );
			} );

			it( 'has button views', () => {
				const headerChildren = view.template.children[ 0 ].template.children[ 0 ];
				const formChildren = view.template.children[ 1 ].template.children[ 0 ];
				const bookmarksButton = view.template.children[ 2 ];

				expect( headerChildren.get( 0 ) ).to.equal( view.backButton );
				expect( headerChildren.get( 2 ) ).to.equal( view.settingsButton );
				expect( formChildren.last.template.children[ 1 ] ).to.equal( view.saveButtonView );
				expect( bookmarksButton ).to.equal( view.bookmarksButton );
			} );
		} );
	} );

	describe( 'render()', () => {
		it( 'should register child views in #_focusables', () => {
			expect( view._focusables.map( f => f ) ).to.have.members( [
				view.backButton,
				view.settingsButton,
				view.displayedTextInputView,
				view.urlInputView,
				view.saveButtonView,
				view.bookmarksButton
			] );
		} );

		it( 'should register child views #element in #focusTracker', () => {
			const view = new LinkFormView( { t: () => {} }, { manualDecorators: [] } );

			const spy = testUtils.sinon.spy( view.focusTracker, 'add' );

			view.render();

			sinon.assert.calledWithExactly( spy.getCall( 0 ), view.backButton.element );
			sinon.assert.calledWithExactly( spy.getCall( 1 ), view.settingsButton.element );
			sinon.assert.calledWithExactly( spy.getCall( 2 ), view.displayedTextInputView.element );
			sinon.assert.calledWithExactly( spy.getCall( 3 ), view.urlInputView.element );
			sinon.assert.calledWithExactly( spy.getCall( 4 ), view.saveButtonView.element );
			sinon.assert.calledWithExactly( spy.getCall( 5 ), view.bookmarksButton.element );

			view.destroy();
		} );

		it( 'starts listening for #keystrokes coming from #element', () => {
			const view = new LinkFormView( { t: () => {} }, { manualDecorators: [] } );

			const spy = sinon.spy( view.keystrokes, 'listenTo' );

			view.render();
			sinon.assert.calledOnce( spy );
			sinon.assert.calledWithExactly( spy, view.element );

			view.destroy();
		} );

		describe( 'activates keyboard navigation for the toolbar', () => {
			it( 'so "tab" focuses the next focusable item', () => {
				const keyEvtData = {
					keyCode: keyCodes.tab,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				// Mock the url input is focused.
				view.focusTracker.isFocused = true;
				view.focusTracker.focusedElement = view.urlInputView.element;

				const spy = sinon.spy( view.saveButtonView, 'focus' );

				view.keystrokes.press( keyEvtData );
				sinon.assert.calledOnce( keyEvtData.preventDefault );
				sinon.assert.calledOnce( keyEvtData.stopPropagation );
				sinon.assert.calledOnce( spy );
			} );

			it( 'so "shift + tab" focuses the previous focusable item', () => {
				const spy = sinon.spy( view.bookmarksButton, 'focus' );

				const keyEvtData = {
					keyCode: keyCodes.tab,
					shiftKey: true,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				// Mock the cancel button is focused.
				view.focusTracker.isFocused = true;
				view.focusTracker.focusedElement = view.backButton.element;
				view.keystrokes.press( keyEvtData );

				sinon.assert.calledOnce( keyEvtData.preventDefault );
				sinon.assert.calledOnce( keyEvtData.stopPropagation );
				sinon.assert.calledOnce( spy );
			} );
		} );
	} );

	describe( 'isValid()', () => {
		it( 'should reset error after successful validation', () => {
			const view = new LinkFormView( { t: () => {} }, { manualDecorators: [] }, [
				() => undefined
			] );

			expect( view.isValid() ).to.be.true;
			expect( view.urlInputView.errorText ).to.be.null;
		} );

		it( 'should display first error returned from validators list', () => {
			const view = new LinkFormView( { t: () => {} }, { manualDecorators: [] }, [
				() => undefined,
				() => 'Foo bar',
				() => 'Another error'
			] );

			expect( view.isValid() ).to.be.false;
			expect( view.urlInputView.errorText ).to.be.equal( 'Foo bar' );
		} );

		it( 'should pass view reference as argument to validator', () => {
			const validatorSpy = sinon.spy();
			const view = new LinkFormView( { t: () => {} }, { manualDecorators: [] }, [ validatorSpy ] );

			view.isValid();

			expect( validatorSpy ).to.be.calledOnceWithExactly( view );
		} );
	} );

	describe( 'resetFormStatus()', () => {
		it( 'should clear form input errors', () => {
			view.urlInputView.errorText = 'Error';
			view.resetFormStatus();
			expect( view.urlInputView.errorText ).to.be.null;
		} );
	} );

	describe( 'destroy()', () => {
		it( 'should destroy the FocusTracker instance', () => {
			const destroySpy = sinon.spy( view.focusTracker, 'destroy' );

			view.destroy();

			sinon.assert.calledOnce( destroySpy );
		} );

		it( 'should destroy the KeystrokeHandler instance', () => {
			const destroySpy = sinon.spy( view.keystrokes, 'destroy' );

			view.destroy();

			sinon.assert.calledOnce( destroySpy );
		} );
	} );

	describe( 'DOM bindings', () => {
		describe( 'submit event', () => {
			it( 'should trigger submit event', () => {
				const spy = sinon.spy();

				view.on( 'submit', spy );
				view.element.dispatchEvent( new Event( 'submit' ) );

				expect( spy.calledOnce ).to.true;
			} );
		} );
	} );

	describe( 'focus()', () => {
		it( 'focuses the #urlInputView', () => {
			const spy = sinon.spy( view.urlInputView, 'focus' );

			view.focus();

			sinon.assert.calledOnce( spy );
		} );
	} );

	describe( 'URL getter', () => {
		it( 'null value should be returned in URL getter if element is null', () => {
			view.urlInputView.fieldView.element = null;

			expect( view.url ).to.be.equal( null );
		} );

		it( 'trimmed DOM input value should be returned in URL getter', () => {
			view.urlInputView.fieldView.element.value = '  https://cksource.com/  ';

			expect( view.url ).to.be.equal( 'https://cksource.com/' );
		} );
	} );

	describe( 'manual decorators', () => {
		let view, collection, linkCommand;

		beforeEach( () => {
			collection = new Collection();
			collection.add( new ManualDecorator( {
				id: 'decorator1',
				label: 'Foo',
				attributes: {
					foo: 'bar'
				}
			} ) );
			collection.add( new ManualDecorator( {
				id: 'decorator2',
				label: 'Download',
				attributes: {
					download: 'download'
				},
				defaultValue: true
			} ) );
			collection.add( new ManualDecorator( {
				id: 'decorator3',
				label: 'Multi',
				attributes: {
					class: 'fancy-class',
					target: '_blank',
					rel: 'noopener noreferrer'
				}
			} ) );

			class LinkCommandMock {
				constructor( manualDecorators ) {
					this.manualDecorators = manualDecorators;
					this.set( 'value' );
				}
			}
			mix( LinkCommandMock, ObservableMixin );

			linkCommand = new LinkCommandMock( collection );

			view = new LinkFormView( { t: val => val }, linkCommand );
			view.render();
		} );

		afterEach( () => {
			view.destroy();
			collection.clear();
		} );

		it( 'switch buttons reflects state of manual decorators', () => {
			expect( view._manualDecoratorSwitches.length ).to.equal( 3 );

			expect( view._manualDecoratorSwitches.get( 0 ) ).to.deep.include( {
				name: 'decorator1',
				label: 'Foo',
				isOn: false
			} );
			expect( view._manualDecoratorSwitches.get( 1 ) ).to.deep.include( {
				name: 'decorator2',
				label: 'Download',
				isOn: true
			} );
			expect( view._manualDecoratorSwitches.get( 2 ) ).to.deep.include( {
				name: 'decorator3',
				label: 'Multi',
				isOn: false
			} );
		} );

		it( 'reacts on switch button changes', () => {
			const modelItem = collection.first;
			const viewItem = view._manualDecoratorSwitches.first;

			expect( modelItem.value ).to.be.undefined;
			expect( viewItem.isOn ).to.be.false;

			viewItem.element.dispatchEvent( new Event( 'click' ) );

			expect( modelItem.value ).to.be.true;
			expect( viewItem.isOn ).to.be.true;

			viewItem.element.dispatchEvent( new Event( 'click' ) );

			expect( modelItem.value ).to.be.false;
			expect( viewItem.isOn ).to.be.false;
		} );

		it( 'reacts on switch button changes for the decorator with defaultValue', () => {
			const modelItem = collection.get( 1 );
			const viewItem = view._manualDecoratorSwitches.get( 1 );

			expect( modelItem.value ).to.be.undefined;
			expect( viewItem.isOn ).to.be.true;

			viewItem.element.dispatchEvent( new Event( 'click' ) );

			expect( modelItem.value ).to.be.false;
			expect( viewItem.isOn ).to.be.false;

			viewItem.element.dispatchEvent( new Event( 'click' ) );

			expect( modelItem.value ).to.be.true;
			expect( viewItem.isOn ).to.be.true;
		} );

		describe( 'getDecoratorSwitchesState()', () => {
			it( 'should provide object with decorators states', () => {
				expect( view.getDecoratorSwitchesState() ).to.deep.equal( {
					decorator1: false,
					decorator2: true,
					decorator3: false
				} );

				view._manualDecoratorSwitches.map( item => {
					item.element.dispatchEvent( new Event( 'click' ) );
				} );

				view._manualDecoratorSwitches.get( 2 ).element.dispatchEvent( new Event( 'click' ) );

				expect( view.getDecoratorSwitchesState() ).to.deep.equal( {
					decorator1: true,
					decorator2: false,
					decorator3: false
				} );
			} );

			it( 'should use decorator default value if command and decorator values are not set', () => {
				expect( view.getDecoratorSwitchesState() ).to.deep.equal( {
					decorator1: false,
					decorator2: true,
					decorator3: false
				} );
			} );

			it( 'should use a decorator value if decorator value is set', () => {
				for ( const decorator of collection ) {
					decorator.value = true;
				}

				expect( view.getDecoratorSwitchesState() ).to.deep.equal( {
					decorator1: true,
					decorator2: true,
					decorator3: true
				} );

				for ( const decorator of collection ) {
					decorator.value = false;
				}

				expect( view.getDecoratorSwitchesState() ).to.deep.equal( {
					decorator1: false,
					decorator2: false,
					decorator3: false
				} );
			} );

			it( 'should use a decorator value if link command value is set', () => {
				linkCommand.value = '';

				expect( view.getDecoratorSwitchesState() ).to.deep.equal( {
					decorator1: false,
					decorator2: false,
					decorator3: false
				} );

				for ( const decorator of collection ) {
					decorator.value = false;
				}

				expect( view.getDecoratorSwitchesState() ).to.deep.equal( {
					decorator1: false,
					decorator2: false,
					decorator3: false
				} );

				for ( const decorator of collection ) {
					decorator.value = true;
				}

				expect( view.getDecoratorSwitchesState() ).to.deep.equal( {
					decorator1: true,
					decorator2: true,
					decorator3: true
				} );
			} );
		} );
	} );

	describe( 'localization of manual decorators', () => {
		before( () => {
			addTranslations( 'pl', {
				'Open in a new tab': 'Otwórz w nowym oknie'
			} );
		} );
		after( () => {
			clearTranslations();
		} );

		let editor, editorElement, linkFormView;

		beforeEach( () => {
			editorElement = document.createElement( 'div' );
			document.body.appendChild( editorElement );

			return ClassicTestEditor
				.create( editorElement, {
					plugins: [ Link ],
					toolbar: [ 'link' ],
					language: 'pl',
					link: {
						decorators: {
							IsExternal: {
								mode: 'manual',
								label: 'Open in a new tab',
								attributes: {
									target: '_blank'
								}
							}
						}
					}
				} )
				.then( newEditor => {
					editor = newEditor;
					linkFormView = new LinkFormView( editor.locale, editor.commands.get( 'link' ) );
				} );
		} );

		afterEach( () => {
			editorElement.remove();

			return editor.destroy();
		} );

		it( 'translates labels of manual decorators UI', () => {
			expect( linkFormView._manualDecoratorSwitches.first.label ).to.equal( 'Otwórz w nowym oknie' );
		} );
	} );
} );
