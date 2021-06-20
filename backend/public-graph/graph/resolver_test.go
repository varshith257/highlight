package graph

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"testing"
	"time"

	e "github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	_ "gorm.io/driver/postgres"
	"gorm.io/gorm"

	parse "github.com/highlight-run/highlight/backend/event-parse"
	"github.com/highlight-run/highlight/backend/model"
	"github.com/highlight-run/highlight/backend/util"
)

var DB *gorm.DB

// Gets run once; M.run() calls the tests in this file.
func TestMain(m *testing.M) {
	dbName := "highlight_testing_db"
	testLogger := log.WithFields(log.Fields{"DB_HOST": os.Getenv("PSQL_HOST"), "DB_NAME": dbName})
	var err error
	DB, err = util.CreateAndMigrateTestDB("highlight_testing_db")
	if err != nil {
		testLogger.Error(e.Wrap(err, "error creating testdb"))
	}
	code := m.Run()
	os.Exit(code)
}

func TestEventsParsingE2E(t *testing.T) {
	eventBytes, err := ioutil.ReadFile("./sample-events/readable-events.json")
	if err != nil {
		t.Fatalf("error reading: %v", err)
	}
	parsedEvents, err := parse.EventsFromString(string(eventBytes))
	if err != nil {
		t.Fatal(e.Wrap(err, "error parsing events from schema interfaces"))
	}

	// If we see a snapshot event, attempt to inject CORS stylesheets.
	log.Printf("size of parsed events: %v \n", len(parsedEvents.Events))
	for _, e := range parsedEvents.Events {
		if e.Type == parse.FullSnapshot {
			d, err := parse.InjectStylesheets(e.Data)
			if err != nil {
				continue
			}
			e.Data = d
		}
	}

	f1 := fmt.Sprintf("./test-events/%v-got.json", 3)
	_, err = os.OpenFile(f1, os.O_RDONLY|os.O_CREATE, 0666)
	if err != nil {
		t.Fatalf("something else: %v", err)
	}
	want, err := json.MarshalIndent(json.RawMessage(eventBytes), "", "   ")
	if err != nil {
		t.Fatalf("something else: %v", err)
	}
	err = ioutil.WriteFile(f1, want, 0644)
	if err != nil {
		t.Fatalf("something else: %v", err)
	}

	f2 := fmt.Sprintf("./test-events/%v-want.json", 4)
	_, err = os.OpenFile(f2, os.O_RDONLY|os.O_CREATE, 0666)
	if err != nil {
		t.Fatalf("something else: %v", err)
	}
	got, err := json.MarshalIndent(parsedEvents, "", "  ")
	if err != nil {
		t.Fatal(e.Wrap(err, "error marshaling events from schema interfaces"))
	}
	err = ioutil.WriteFile(f2, got, 0644)
	if err != nil {
		t.Fatalf("something else: %v", err)
	}
}

func TestHandleErrorAndGroup(t *testing.T) {
	// construct table of sub-tests to run
	nullStr := "null"
	metaDataStr := `[{"timestamp":"2000-08-01T00:00:00Z","error_id":1,"session_id":0,"browser":"","os":"","visited_url":""},{"timestamp":"2000-08-01T00:00:00Z","error_id":2,"session_id":0,"browser":"","os":"","visited_url":""}]`
	longTraceStr := `[{"this":"is"},{"a":"longer"},{"stack":"trace"}]`
	shortTraceStr := `[{"this":"a"},{"short":"stack"}]`
	tests := map[string]struct {
		errorsToInsert      []model.ErrorObject
		expectedErrorGroups []model.ErrorGroup
	}{
		"test two errors with same environment but different case": {
			errorsToInsert: []model.ErrorObject{
				{
					OrganizationID: 1,
					Environment:    "dev",
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 1},
				},
				{
					OrganizationID: 1,
					Environment:    "dEv",
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 2},
				},
			},
			expectedErrorGroups: []model.ErrorGroup{
				{
					OrganizationID: 1,
					Trace:          nullStr,
					Resolved:       &model.F,
					State:          model.ErrorGroupStates.OPEN,
					MetadataLog:    &metaDataStr,
					FieldGroup:     &nullStr,
					Environments:   `{"dev":2}`,
				},
			},
		},
		"test two errors with different environment": {
			errorsToInsert: []model.ErrorObject{
				{
					OrganizationID: 1,
					Environment:    "dev",
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 1},
				},
				{
					OrganizationID: 1,
					Environment:    "prod",
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 2},
				},
			},
			expectedErrorGroups: []model.ErrorGroup{
				{
					OrganizationID: 1,
					Trace:          nullStr,
					Resolved:       &model.F,
					State:          model.ErrorGroupStates.OPEN,
					MetadataLog:    &metaDataStr,
					FieldGroup:     &nullStr,
					Environments:   `{"dev":1,"prod":1}`,
				},
			},
		},
		"two errors, one with empty environment": {
			errorsToInsert: []model.ErrorObject{
				{
					OrganizationID: 1,
					Environment:    "dev",
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 1},
				},
				{
					OrganizationID: 1,
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 2},
				},
			},
			expectedErrorGroups: []model.ErrorGroup{
				{
					OrganizationID: 1,
					Trace:          nullStr,
					Resolved:       &model.F,
					State:          model.ErrorGroupStates.OPEN,
					MetadataLog:    &metaDataStr,
					FieldGroup:     &nullStr,
					Environments:   `{"dev":1}`,
				},
			},
		},
		"test longer error stack first": {
			errorsToInsert: []model.ErrorObject{
				{
					OrganizationID: 1,
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 1},
					Trace:          &longTraceStr,
				},
				{
					OrganizationID: 1,
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 2},
					Trace:          &shortTraceStr,
				},
			},
			expectedErrorGroups: []model.ErrorGroup{
				{
					OrganizationID: 1,
					Trace:          longTraceStr,
					Resolved:       &model.F,
					State:          model.ErrorGroupStates.OPEN,
					MetadataLog:    &metaDataStr,
					FieldGroup:     &nullStr,
					Environments:   `{}`,
				},
			},
		},
		"test shorter error stack first": {
			errorsToInsert: []model.ErrorObject{
				{
					OrganizationID: 1,
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 1},
					Trace:          &shortTraceStr,
				},
				{
					OrganizationID: 1,
					Model:          model.Model{CreatedAt: time.Date(2000, 8, 1, 0, 0, 0, 0, time.UTC), ID: 2},
					Trace:          &longTraceStr,
				},
			},
			expectedErrorGroups: []model.ErrorGroup{
				{
					OrganizationID: 1,
					Trace:          longTraceStr,
					Resolved:       &model.F,
					MetadataLog:    &metaDataStr,
					FieldGroup:     &nullStr,
					Environments:   `{}`,
					State:          model.ErrorGroupStates.OPEN,
				},
			},
		},
	}
	// run tests
	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			defer func(db *gorm.DB) {
				err := util.ClearTablesInDB(db)
				if err != nil {
					t.Fatal(e.Wrap(err, "error clearing database"))
				}
			}(DB)
			// test logic
			r := &Resolver{DB: DB}
			receivedErrorGroups := make(map[string]model.ErrorGroup)
			for _, errorObj := range tc.errorsToInsert {
				var frames []interface{}
				if errorObj.Trace != nil {
					if err := json.Unmarshal([]byte(*errorObj.Trace), &frames); err != nil {
						t.Fatal(e.Wrap(err, "error unmarshalling error stack trace frames"))
					}
				}
				errorGroup, err := r.HandleErrorAndGroup(&errorObj, frames, nil)
				if err != nil {
					t.Fatal(e.Wrap(err, "error handling error and group"))
				}
				if errorGroup != nil {
					id := strconv.Itoa(errorGroup.ID)
					receivedErrorGroups[id] = *errorGroup
				}
			}
			var i int
			for _, errorGroup := range receivedErrorGroups {
				isEqual, diff, err := model.AreModelsWeaklyEqual(&errorGroup, &tc.expectedErrorGroups[i])
				if err != nil {
					t.Fatal(e.Wrap(err, "error comparing two error groups"))
				}
				if !isEqual {
					t.Fatalf("received error group not equal to expected error group. diff: %+v", diff)
				}
				i++
			}
		})
	}
}
