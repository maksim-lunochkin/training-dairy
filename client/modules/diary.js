import axios from 'axios';
import { normalize, schema } from 'normalizr';
import { getDraft, getAuthToken } from '../selectors';
import _unset from 'lodash/unset';
import moment from 'moment';


const record = new schema.Entity('records', {}, {idAttribute: '_id'});
const exercise = new schema.Entity('exercises', {}, {idAttribute: '_id'});


const SET_EXERCISES = 'diary/SET_EXERCISES';
const SET_RECORDS = 'diary/SET_RECORDS';
const ADD_RECORD = 'diary/ADD_RECORD';
const REMOVE_RECORD = 'diary/REMOVE_RECORD';
const OPEN_ADDING = 'diary/OPEN_ADDING';
const CANCEL_ADDING = 'diary/CANCEL_ADDING';
const ADD_REPS = 'diary/ADD_REPS';
const SET_REPS = 'diary/SET_REPS';
const SET_DRAFT_EXERCISE = 'diary/SET_DRAFT_EXERCISE';
const SET_DRAFT_DATE = 'diary/SET_DRAFT_DATE';


const baseDraft = {
  adding: false,
  data: {
    date: moment().startOf('day').toDate(),
    exercise: undefined,
    reps: ['']
  }
};

const initialState = {
  exercises: {
    entities: {},
    result: [],
  },
  records: {
    entities: {},
    result: []
  },
  draft: baseDraft
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SET_EXERCISES:
      return {...state, exercises: action.exercises};
    case SET_RECORDS:
      return {...state, records: action.records};
    case ADD_RECORD:
      return {
        ...state,
        records: {
          ...state.records,
          entities: {
            ...state.records.entities,
            records: Object.assign({}, state.records.entities.records, action.record.entities.records)
          },
          result: [...state.records.result, action.record.result]
        }
      };
    case REMOVE_RECORD:
      const copy = {...state};
      _unset(copy, ['records', 'entities', 'records', action.id]);
      const index = copy.records.result.indexOf(action.id);
      _unset(copy, ['records', 'result', index]);
      return copy;
    case OPEN_ADDING:
      return {...state, draft: {...state.draft, adding: true}};
    case CANCEL_ADDING:
      return {...state, draft: {...baseDraft, data: {...baseDraft.data, date: state.draft.data.date}}};
    case ADD_REPS:
      return {...state, draft: {
        ...state.draft,
        data: {
          ...state.draft.data,
          reps: [...state.draft.data.reps, action.reps]
        }
      }};
    case SET_REPS:
      const reps = [...state.draft.data.reps];
      reps[action.index] = action.reps;
      return {...state, draft: {...state.draft, data: {...state.draft.data, reps}}};
    case SET_DRAFT_EXERCISE:
      return {...state, draft: {...state.draft, data: {...state.draft.data, exercise: action.exercise}}};
    case SET_DRAFT_DATE:
      return {...state, draft: {...state.draft, data: {...state.draft.data, date: action.date}}};
    default:
      return state;
  }
};


const setExercises = exercises => ({
  type: SET_EXERCISES,
  exercises
});

export const loadExercises = cb => dispatch => {
  axios.get('/api/exercises').then(response => {
    dispatch(
      setExercises(
        normalize(response.data, [exercise])
      )
    );

    if (cb) {
      cb();
    }
  });
};

const setRecords = records => ({
  type: SET_RECORDS,
  records
});

const addRecord = record => ({
  type: ADD_RECORD,
  record
});

const removeRecordLocal = id => ({
  type: REMOVE_RECORD,
  id
});


const deserializeRecord = one => {
  one.date = moment(one.date).toDate();
  return one;
};

export const loadRecords = cb => (dispatch, getState) => {
  let token = getAuthToken(getState());
  axios.get('/api/records', {headers: {Authorization: 'JWT ' + token}}).then(response => {
    dispatch(
      setRecords(
        normalize(response.data.map(deserializeRecord), [record])
      )
    );

    if (cb) {
      cb();
    }
  });
};

export const setDraftExercise = exercise => ({
  type: SET_DRAFT_EXERCISE,
  exercise
});

export const openAdding = () => ({
  type: OPEN_ADDING
});

export const cancelAdding = () => ({
  type: CANCEL_ADDING
});

export const addReps = reps => ({
  type: ADD_REPS,
  reps
});

export const setReps = (index, reps) => ({
  type: SET_REPS,
  index,
  reps
});

export const setDraftDate = date => ({
  type: SET_DRAFT_DATE,
  date
});

export const saveRecordDraft = cb => (dispatch, getState) => {
  let token = getAuthToken(getState());
  axios.post('/api/records', getDraft(getState()).data, {headers: {Authorization: 'JWT ' + token}}).then(response => {
    dispatch(
      addRecord(
        normalize(deserializeRecord(response.data), record)
      )
    );
    dispatch(cancelAdding());

    if (cb) {
      cb();
    }
  });
};

export const removeRecord = (id, cb) => (dispatch, getState) => {
  let token = getAuthToken(getState());
  axios.delete(`/api/records/${id}`, {headers: {Authorization: 'JWT ' + token}}).then(() => {
    dispatch(removeRecordLocal(id));

    if (cb) {
      cb();
    }
  });
};
