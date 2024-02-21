import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import dbClient from '../utils/db';

describe( 'dbClient test suite', () => {
  describe( 'dbClient.isAlive', () => {
    it( 'should return true when dbClient is connected', ( done ) => {
      let isAlive = false;
      isAlive = dbClient.isAlive()
      expect( isAlive ).to.be.true;
      done()
    } )  
  } )
  
  describe( 'dbClient.nbUsers', () => {
    it( 'should return number of users in db', ( done ) => {
      dbClient.nbUsers().then( result => {
        expect( result ).to.not.be.null
        done()
      })
    } )
  } )
  
  describe( 'dbClient.nbFiles', () => {
    it( 'should return number of files in db', ( done ) => {
      dbClient.nbFiles().then( result => {
        expect( result ).to.not.be.null
        done()
      })
    } )
  } )
  
  describe( 'dbClient.getUserById', () => {
    it( 'should return null for invalid userId', ( done ) => {
      dbClient.getUserById( 'invalid_user_id' ).then( result => {
        expect( result ).to.be.null;
        done()
      })
    } )
  })
  
  describe( 'dbClient.getFileById', () => {
    it( 'should return null for invalid fileId', ( done ) => {
      dbClient.getFileById( 'invalid_file_id' ).then( result => {
        expect( result ).to.be.null;
        done()
      })
    } )
  })
})
