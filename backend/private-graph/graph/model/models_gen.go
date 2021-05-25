// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

import (
	"fmt"
	"io"
	"strconv"
	"time"
)

type AverageSessionLength struct {
	Length float64 `json:"length"`
}

type BillingDetails struct {
	Plan               *Plan `json:"plan"`
	Meter              int64 `json:"meter"`
	SessionsOutOfQuota int64 `json:"sessionsOutOfQuota"`
}

type DateRangeInput struct {
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
}

type ErrorAlert struct {
	ChannelsToNotify     []*SanitizedSlackChannel `json:"ChannelsToNotify"`
	ExcludedEnvironments []*string                `json:"ExcludedEnvironments"`
	CountThreshold       int64                    `json:"CountThreshold"`
}

type ErrorAlertInput struct {
	ChannelsToNotify     []*SanitizedSlackChannelInput `json:"ChannelsToNotify"`
	ExcludedEnvironments []*string                     `json:"ExcludedEnvironments"`
	CountThreshold       int64                         `json:"CountThreshold"`
}

type ErrorMetadata struct {
	ErrorID    int       `json:"error_id"`
	SessionID  int       `json:"session_id"`
	Timestamp  time.Time `json:"timestamp"`
	Os         *string   `json:"os"`
	Browser    *string   `json:"browser"`
	VisitedURL *string   `json:"visited_url"`
}

type ErrorSearchParamsInput struct {
	DateRange    *DateRangeInput `json:"date_range"`
	Os           *string         `json:"os"`
	Browser      *string         `json:"browser"`
	VisitedURL   *string         `json:"visited_url"`
	HideResolved *bool           `json:"hide_resolved"`
	Event        *string         `json:"event"`
}

type ErrorTrace struct {
	FileName     *string `json:"file_name"`
	LineNumber   *int    `json:"line_number"`
	FunctionName *string `json:"function_name"`
	ColumnNumber *int    `json:"column_number"`
}

type LengthRangeInput struct {
	Min *int `json:"min"`
	Max *int `json:"max"`
}

type NewUsersCount struct {
	Count int64 `json:"count"`
}

type Plan struct {
	Type  PlanType `json:"type"`
	Quota int      `json:"quota"`
}

type ReferrerTablePayload struct {
	Host    string  `json:"host"`
	Count   int     `json:"count"`
	Percent float64 `json:"percent"`
}

type SanitizedAdmin struct {
	ID       int     `json:"id"`
	Name     *string `json:"name"`
	Email    string  `json:"email"`
	PhotoURL *string `json:"photo_url"`
}

type SanitizedAdminInput struct {
	ID    int     `json:"id"`
	Name  *string `json:"name"`
	Email string  `json:"email"`
}

type SanitizedSlackChannel struct {
	WebhookChannel   *string `json:"webhook_channel"`
	WebhookChannelID *string `json:"webhook_channel_id"`
}

type SanitizedSlackChannelInput struct {
	WebhookChannel   *string `json:"webhook_channel"`
	WebhookChannelID *string `json:"webhook_channel_id"`
}

type SearchParamsInput struct {
	UserProperties     []*UserPropertyInput `json:"user_properties"`
	ExcludedProperties []*UserPropertyInput `json:"excluded_properties"`
	TrackProperties    []*UserPropertyInput `json:"track_properties"`
	DateRange          *DateRangeInput      `json:"date_range"`
	LengthRange        *LengthRangeInput    `json:"length_range"`
	Os                 *string              `json:"os"`
	Browser            *string              `json:"browser"`
	DeviceID           *string              `json:"device_id"`
	VisitedURL         *string              `json:"visited_url"`
	Referrer           *string              `json:"referrer"`
	Identified         *bool                `json:"identified"`
	HideViewed         *bool                `json:"hide_viewed"`
	FirstTime          *bool                `json:"first_time"`
}

type TopUsersPayload struct {
	Identifier           string  `json:"identifier"`
	TotalActiveTime      int     `json:"total_active_time"`
	ActiveTimePercentage float64 `json:"active_time_percentage"`
}

type UserFingerprintCount struct {
	Count int64 `json:"count"`
}

type UserPropertyInput struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type PlanType string

const (
	PlanTypeFree       PlanType = "Free"
	PlanTypeBasic      PlanType = "Basic"
	PlanTypeStartup    PlanType = "Startup"
	PlanTypeEnterprise PlanType = "Enterprise"
)

var AllPlanType = []PlanType{
	PlanTypeFree,
	PlanTypeBasic,
	PlanTypeStartup,
	PlanTypeEnterprise,
}

func (e PlanType) IsValid() bool {
	switch e {
	case PlanTypeFree, PlanTypeBasic, PlanTypeStartup, PlanTypeEnterprise:
		return true
	}
	return false
}

func (e PlanType) String() string {
	return string(e)
}

func (e *PlanType) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = PlanType(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid PlanType", str)
	}
	return nil
}

func (e PlanType) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type SessionLifecycle string

const (
	SessionLifecycleAll       SessionLifecycle = "All"
	SessionLifecycleLive      SessionLifecycle = "Live"
	SessionLifecycleCompleted SessionLifecycle = "Completed"
)

var AllSessionLifecycle = []SessionLifecycle{
	SessionLifecycleAll,
	SessionLifecycleLive,
	SessionLifecycleCompleted,
}

func (e SessionLifecycle) IsValid() bool {
	switch e {
	case SessionLifecycleAll, SessionLifecycleLive, SessionLifecycleCompleted:
		return true
	}
	return false
}

func (e SessionLifecycle) String() string {
	return string(e)
}

func (e *SessionLifecycle) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = SessionLifecycle(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid SessionLifecycle", str)
	}
	return nil
}

func (e SessionLifecycle) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}
