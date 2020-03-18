import { expect } from 'chai';
import { Vcr } from './../src/index';
import express = require('express');
import http = require('http');
import path = require('path');

const got = require('got');
const PORT = 8675;

describe('Mocha VCR', function() {
  let server: http.Server;
  const vcr = new Vcr(path.join(__dirname, 'cassettes'));
  let response: any;

  beforeEach((done) => {
    const app = express();
    response = 'response1';

    app.get('/test', (_req, res) => {
      res.send(response);
    });

    server = app.listen(PORT, done);
  });

  afterEach((done) => {
    server.close(done);
  });

  after(() => vcr.removeAllCassettes());

  describe('Mocks the http requests that were recorded', function() {
    // tests are executed in reverse order that they're compiled in
    vcr.createTest('can be written', async () => {
      const resp = await got(`http://localhost:${PORT}/test`);
      expect(resp.body).to.be.equal('response1');
    })
      .recordCassette()
      .register(this);

    vcr.createTest('can be read with an async function', async () => {
      response = 'incorrectResponse';
      const resp = await got(`http://localhost:${PORT}/test`);
      expect(resp.body).to.be.equal('response1');
    })
      .playCassette('Mocha VCR mocks the http requests that were recorded can be written.cassette')
      .register(this);

    vcr.createTest('can be read with a done param', (done) => {
      response = 'incorrectResponse';
      got(`http://localhost:${PORT}/test`)
        .then((resp) => expect(resp.body).to.be.equal('response1'))
        .then(() => done())
        .catch(done);
    })
      .playCassette('Mocha VCR mocks the http requests that were recorded can be written.cassette')
      .register(this);

    vcr.createTest('can be read with a returned promise', () => {
      response = 'incorrectResponse';

      return got(`http://localhost:${PORT}/test`)
        .then((resp) => expect(resp.body).to.be.equal('response1'));
    })
      .playCassette('Mocha VCR mocks the http requests that were recorded can be written.cassette')
      .register(this);

    it('will not affect non mocked cases', async () => {
      response = 'incorrectResponse';
      const resp = await got(`http://localhost:${PORT}/test`);
      expect(resp.body).to.be.equal(response);
    });
  });

  describe('Non specified action cases work as expected', function() {
    // the names for these tests must remain the same to map to the same fixture
    vcr.createTest('record case', async () => {
      const resp = await got(`http://localhost:${PORT}/test`);
      expect(resp.body).to.be.equal('response1');
    })
      .register(this)

    vcr.createTest('record case', async () => {
      response = 'incorrectResponse';
      const resp = await got(`http://localhost:${PORT}/test`);
      expect(resp.body).to.be.equal('response1');
    })
      .register(this)
  });

  describe('passes when there are no http calls made', function() {
    vcr.createTest('namespace collision', async () => {
      expect(true).to.be.true
    })
      .register(this)

    vcr.createTest('namespace collision', () => {
      expect(true).to.be.true
    })
      .register(this)

    vcr.createTest('namespace collision', (done) => {
      expect(true).to.be.true
      done()
    })
      .register(this)

    vcr.createTest('namespace collision', () => {
      expect(true).to.be.true

      return Promise.resolve()
    })
      .register(this)
  });

  // Unskip this to test timeout cases. If timeout catching is not implemented properly a nock error like
  // "Module's request already overridden for http protocol." or  "Nock recording already in progress" will be thrown
  // If it is implemented properly, then only the third test will fail, and it will be a timeout error
  describe('timeout suite', function() {
    // record
    vcr.createTest('can handle a timeout', async () => {
      const resp = await got(`http://localhost:${PORT}/test`);
      expect(resp.body).to.be.equal('response1');
    })
      .register(this)

    // replay
    vcr.createTest('can handle a timeout', async () => {
      response = 'incorrectResponse';
      const resp = await got(`http://localhost:${PORT}/test`);
      expect(resp.body).to.be.equal('response1');
    })
      .register(this)

    //vcr.createTest('can handle a timeout', (done) => {
    //  setTimeout(() => {
    //    done()
    //  }, 10000)
  //  })
    //  .timeout(500)
    //  .register(this)

    // replay
    vcr.createTest('can handle a timeout', async () => {
      response = 'incorrectResponse';
      const resp = await got(`http://localhost:${PORT}/test`);
      expect(resp.body).to.be.equal('response1');
    })
      .register(this)
  });
});