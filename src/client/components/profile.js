/* Copyright G. Hemingway, @2020 - All rights reserved */
'use strict';

import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { GravHash } from './header';
import { GameList } from './game-list';
import {
  ErrorMessage,
  InfoBlock,
  InfoData,
  InfoLabels,
  ShortP
} from './shared';

const ProfileBlockBase = styled.div`
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto;
  grid-template-areas: 'pic' 'profile';
  padding: 1em;

  @media (min-width: 500px) {
    grid-template-columns: auto 1fr;
    grid-template-areas: 'pic profile';
    padding: 2em;
  }
`;

const ProfileImage = styled.img`
  grid-area: pic;
  max-width: 150px;
  padding: 1em;
  @media (min-width: 500px) {
    padding: 0.5em;
    max-width: 200px;
  }
`;

const ProfileBlock = props => {
  return (
    <ProfileBlockBase>
      <ProfileImage src={GravHash(props.primary_email, 200)} />
      <InfoBlock>
        <InfoLabels>
          <p>Username:</p>
          <p>First Name:</p>
          <p>Last Name:</p>
          <p>City:</p>
          <p>Email Address:</p>
        </InfoLabels>
        <InfoData>
          <ShortP>{props.username}</ShortP>
          <ShortP>{props.first_name}</ShortP>
          <ShortP>{props.last_name}</ShortP>
          <ShortP>{props.city}</ShortP>
          <ShortP>{props.primary_email}</ShortP>
        </InfoData>
      </InfoBlock>
    </ProfileBlockBase>
  );
};

const EditLinkBase = styled.div`
  grid-area: sb;
  display: none;
  & > a {
  }
  @media (min-width: 500px) {
    display: inherit;
  }
`;

const EditLink = ({ show, username }) => {
  return show ? (
    <EditLinkBase>
      <Link to={"/edit/"+username}>Edit Profile</Link>
    </EditLinkBase>
  ) : null;
};

const ProfileBase = styled.div`
  grid-area: main;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const Profile = props => {
  let [state, setState] = useState({
    username: '',
    first_name: '',
    last_name: '',
    primary_email: '',
    city: '',
    games: [],
    error: ''
  });

  const fetchUser = username => {
    fetch(`/v1/user/${username}`)
      .then(res => res.json())
      .then(data => {
        setState(data);
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchUser(props.match.params.username);
  }, [props]);

  // Is the logged in user viewing their own profile
  const isUser = state.username === props.currentUser;
  return (
    <Fragment>
      <EditLink show={isUser} username={state.username}/>
      <ProfileBase>
        <ErrorMessage msg={state.error} hide={true} />
        <ProfileBlock {...state} />
        <GameList
          toCreateGame={isUser}
          games={state.games}
          username={state.username}
        />
      </ProfileBase>
    </Fragment>
  );
};

Profile.propTypes = {
  match: PropTypes.object.isRequired,
  gridPlacement: PropTypes.string,
  user: PropTypes.string
};
