/* Copyright G. Hemingway, @2020 - All rights reserved */
'use strict';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ErrorMessage,
  FormBase,
  FormInput,
  FormLabel,
  FormButton,
  ModalNotify,
  InfoData,
  ShortP
} from './shared';
import { validUsername } from '../../shared';

export const Edit = props => {
  let [state, setState] = useState({
    username: '',
    first_name: '',
    last_name: '',
    city: '',
  });
  let [error, setError] = useState('');
  let [notify, setNotify] = useState('');

  useEffect(() => {
    document.getElementById('first_name').focus();
  }, []);

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

  const onChange = ev => {
    setError('');
    // Update from form and clear errors
    setState({
      ...state,
      [ev.target.name]: ev.target.value
    });
    // Make sure the username is valid
    if (ev.target.name === 'username') {
      let usernameInvalid = validUsername(ev.target.value);
      if (usernameInvalid) setError(`Error: ${usernameInvalid.error}`);
    }
  };

  const onSubmit = async ev => {
    ev.preventDefault();
    // Only proceed if there are no errors
    if (error !== '') return;
    let data = {username: state.username, first_name: state.first_name, last_name: state.last_name, city: state.city};
    const res = await fetch('/v1/user', {
      method: 'PUT',
      body: JSON.stringify(data),
      credentials: 'include',
      headers: {
        'content-type': 'application/json'
      }
    });
    if (res.ok) {
      // Notify users
      setNotify(`${state.username} updated.`);
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };

  const onCancel = async ev => {
    ev.preventDefault();
    props.history.goBack();
  };

  const onAccept = () => {
    setNotify('');
  };

  return (
    <div style={{ gridArea: 'main' }}>
      {notify !== '' ? (
        <ModalNotify
          id="notification"
          msg={notify}
          onAccept={onAccept}
        />
      ) : null}
      <ErrorMessage msg={error} />
      <FormBase>
        <FormLabel htmlFor="username">Username:</FormLabel>
        <InfoData>
        <ShortP>{state.username}</ShortP>
        </InfoData>

        <FormLabel htmlFor="first_name">First Name:</FormLabel>
        <FormInput
          id="first_name"
          name="first_name"
          placeholder="First Name"
          onChange={onChange}
          value={state.first_name}
        />

        <FormLabel htmlFor="last_name">Last Name:</FormLabel>
        <FormInput
          id="last_name"
          name="last_name"
          placeholder="Last Name"
          onChange={onChange}
          value={state.last_name}
        />

        <FormLabel htmlFor="city">City:</FormLabel>
        <FormInput
          id="city"
          name="city"
          placeholder="City"
          onChange={onChange}
          value={state.city}
        />

        <div />
        <div>
          <FormButton id="submitBtn" onClick={onSubmit}>
            Save
          </FormButton>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <FormButton id="cancelBtn" onClick={onCancel}>
            Cancel
          </FormButton>
        </div>
      </FormBase>
    </div>
  );
};

Edit.propTypes = {
  user: PropTypes.string
};
