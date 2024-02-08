import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// test extension is present
	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('hato.gnss.rinex-viewer'));
	});

	// test extension can activate
	test('Extension should be able to activate', function(this: any, done) {
		this.timeout(1 * 60 * 1000);
		const extension = vscode.extensions.getExtension('hato.gnss.rinex-viewer')!;
		if (!extension.isActive) {
			extension.activate().then((api) => {
				done();
			}, (err) => {
				done(err);
			});
		} else {
			done();
		}
	});
});
