"use client"

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, {Draggable, DropArg, EventResizeDoneArg} from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { ChangeEvent, Fragment, useEffect, useState} from 'react'
import {Dialog, Transition} from '@headlessui/react'
import {CheckIcon, ExclamationTriangleIcon} from '@heroicons/react/20/solid'
import {DateSelectArg, EventSourceInput} from "@fullcalendar/core";


const getData = async () => {
  const res = await fetch(`/api/categories`, {
    cache: "no-store"
  })

  if (!res.ok) {
    throw new Error("Failed")
  }

  return res.json()
}

interface Event {
  title: string;
  start?: string | Date | undefined;
  end?: string | Date | undefined;
  id?: number | undefined;
}

export default function Home() {

  let numPrev = 0
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [showMainModal, setShowMainModal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditeModal, setShowEditeModal] = useState(false)
  const [idToDelete, setIdToDelete] = useState<string>('')
  const [idToEdite, setIdToEdite] = useState<string>('')
  const [newEvent, setNewEvent] = useState<Event>({
    title: '',
    start: '',
    end: '',
    id: 0
  })
  const [newInfo, setNewInfo] = useState<Event | null>(null)
  const [timeZone, setTimeZone] = useState<string>('')

  const getEvent = async () => {
    let res = await getData()
    setAllEvents(res)
  }

  useEffect(() => {
    getEvent()
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, []);

  useEffect(() => {
    let draggableEl = document.getElementById('draggable-el')
    if (draggableEl) {
      new Draggable(draggableEl, {
        itemSelector: ".fc-event",
        eventData: function (eventEl) {
          let title = eventEl.getAttribute("title")
          let id = eventEl.getAttribute("data")
          let start = eventEl.getAttribute("start")
          return {title, id, start}
        }
      })
    }
  }, [allEvents])

  function handleDateClick(arg: { date: Date, allDay: boolean }) {
    setNewEvent({...newEvent, start: arg.date, id: new Date().getTime()})
    setShowModal(true)
  }

  const addEvent = async (data: DropArg) => {
    const {dateStr} = data;
    numPrev++
    if (numPrev === 1) {
      const res = await fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          start: dateStr,
          end: '',
          title: data.draggedEl.innerText,
        }),
      });
      if (res.ok) {
        getEvent()
        numPrev = 0
      }
    }
  }

  function handleMainModal(data: any) {
    setShowMainModal(true)
    setIdToEdite(data.el.fcSeg.eventRange.def.publicId)
    setIdToDelete(data.el.fcSeg.eventRange.def.publicId)
  }

  // edit
  function handleEditeModal() {
    setShowEditeModal(true)
    setShowMainModal(false)
    let titleEdite = allEvents.filter((event: Event | undefined) => event?.id?.toString() === idToEdite.toString())
    setNewInfo(titleEdite[0])
  }

  function handleEdite(e: ChangeEvent<HTMLInputElement>) {
    setNewInfo(prev => ({...prev, title: e.target.value}));
  }

  const handleEditeSave = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    const res = await fetch("/api/categories", {
      method: "PUT",
      body: JSON.stringify({
        data: newInfo
      }),
    });
    if (res.ok){
      getEvent()
    }
    setShowEditeModal(false)
    setIdToEdite('')
    setIdToDelete('')
  }

  // delete
  function handleDeleteModal() {
    setShowDeleteModal(true)
    setShowMainModal(false)
  }

  const handleDelete = async () =>  {
    const res = await fetch("/api/categories", {
      method: "DELETE",
      body: JSON.stringify({
        id: idToDelete
      }),
    });
    if (res.ok){
      getEvent()
    }
    setShowDeleteModal(false)
    setIdToEdite('')
    setIdToDelete('')
  }

  function handleCloseModal() {
    setShowModal(false)
    setNewEvent({
      title: '',
      start: '',
      end: '',
      id: 0
    })
    setShowDeleteModal(false)
    setShowEditeModal(false)
    setIdToDelete('')
    setIdToEdite('')
    setShowMainModal(false)
    setNewInfo(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setNewEvent({
      ...newEvent,
      title: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const res = await fetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end
      }),
    });
    if (res.ok){
      getEvent()
      setShowModal(false)
      setNewEvent({
        title: '',
        start: '',
        end: '',
        id: 0
      })
    }
  }

  const handleEventSelection = (info: DateSelectArg) => {
    const { endStr, startStr } = info;
    setNewEvent({
      ...newEvent,
      start: startStr,
      end: endStr,
    })
    setShowModal(true)
  };

  const handleDayDrop = async (info: any) => {
    const { event: { _instance: { range: {end, start} }} } = info;
    const { event: {_def: publicId }} = info
    let itemDrop: Event | null = null
    allEvents.forEach((item: Event) => {
      if(item.id === publicId.publicId){
        item.end = end
        item.start = start
        itemDrop = item
      }
    })
    const res = await fetch("/api/categories", {
      method: "PUT",
      body: JSON.stringify({
        data: itemDrop
      }),
    });
    if (res.ok){
      getEvent()
    }
  }

  const handleMoveTime = async (info: any) => {
    const { event: { _instance: { range: {end, start} }} } = info;
    const { event: {_def: publicId }} = info
    let itemDrop: Event | null = null
    allEvents.forEach((item: Event) => {
      if(item?.id?.toString() === publicId?.publicId.toString()){
        item.end = end
        item.start = start
        itemDrop = item
      }
    })
    const res = await fetch("/api/categories", {
      method: "PUT",
      body: JSON.stringify({
        data: itemDrop
      }),
    });
    if (res.ok){
      getEvent()
    }
  }


  return (
    <>
      <nav className="flex justify-between mb-12 border-b border-violet-100 p-4">
        <h1 className="font-bold text-2xl text-gray-700">Calendar</h1>
      </nav>

      <main className="flex mix-h-screen flex-col items-center justify-between p-24">
        <div className="grid grid-cols-8 w-full">
          <div className="col-span-8">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                interactionPlugin,
                timeGridPlugin
              ]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth, timeGridWeek'
              }}
              events={allEvents as EventSourceInput}
              nowIndicator={true}
              editable={true}
              droppable={true}
              selectable={true}
              selectMirror={true}
              eventDrop={(info) => handleDayDrop(info)} //*
              eventResize={(info) => handleMoveTime(info)} //*
              dateClick={handleDateClick}
              drop={(data) => addEvent(data)}
              eventClick={(data) => handleMainModal(data)}  //*
              slotMinTime="08:00:00"
              slotMaxTime="17:00:00"
              initialView="timeGridWeek"
              select={(info) => handleEventSelection(info)}
              timeZone={timeZone}
              slotLabelFormat={{
                hour: 'numeric',
                minute: 'numeric',
                omitZeroMinute: false,
                meridiem: 'short'
              }}
            />
          </div>
          {/*<div id="draggable-el" className="ml-8 w-full border-2 p-2 rounded-md mt-16 bg-violet-50">*/}
          {/*  <h1>sdasdsaasdasdasd</h1>*/}
          {/*</div>*/}
        </div>


        <Transition.Root show={showMainModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={setShowMainModal}>
            <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"

            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"/>
            </Transition.Child>
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel
                      className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div>
                      <p style={{position: 'absolute', right: '15px', top: '10px', cursor: 'pointer'}}
                         onClick={handleCloseModal}>X</p>
                      <Dialog.Title as="h3"
                                    className="text-base font-semibold leading-6 text-gray-900 text-center mb-4">
                        Select option
                      </Dialog.Title>
                      <div className="sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:col-start-2 disabled:opacity-25"
                            onClick={handleEditeModal}>
                          Edit
                        </button>
                        <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-1 sm:mt-0"
                            onClick={handleDeleteModal}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
        <Transition.Root show={showEditeModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={setShowEditeModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"

            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel
                      className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true"/>
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                          Edit Event
                        </Dialog.Title>
                        <form action="submit" onSubmit={handleEditeSave}>
                          <div className="mt-2">
                            <input type="text" name="title" className="block w-full rounded-md border-0 py-1.5 text-gray-900
                            shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400
                            focus:ring-2
                            focus:ring-inset focus:ring-violet-600
                            sm:text-sm sm:leading-6"
                                   value={newInfo?.title} onChange={(e) => handleEdite(e)} placeholder="Title"/>
                          </div>
                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                            <button
                                type="submit"
                                className="inline-flex w-full justify-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:col-start-2 disabled:opacity-25"
                                disabled={newInfo?.title === ''}
                            >
                              Edit
                            </button>
                            <button
                                type="button"
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                                onClick={handleCloseModal}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
        <Transition.Root show={showDeleteModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={setShowDeleteModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"

            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg
                   bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                  >
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center
                      justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                          <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                            Delete Event
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Are you sure you want to delete this event?
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                      <button type="button" className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm
                      font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto" onClick={handleDelete}>
                        Delete
                      </button>
                      <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900
                      shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={handleCloseModal}
                      >
                        Cancel
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
        <Transition.Root show={showModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={setShowModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                          Add Event
                        </Dialog.Title>
                        <form action="submit" onSubmit={handleSubmit}>
                          <div className="mt-2">
                            <input type="text" name="title" className="block w-full rounded-md border-0 py-1.5 text-gray-900 
                            shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 
                            focus:ring-2 
                            focus:ring-inset focus:ring-violet-600 
                            sm:text-sm sm:leading-6"
                              value={newEvent.title} onChange={(e) => handleChange(e)} placeholder="Title" />
                          </div>
                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                            <button
                              type="submit"
                              className="inline-flex w-full justify-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:col-start-2 disabled:opacity-25"
                              disabled={newEvent.title === ''}
                            >
                              Create
                            </button>
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                              onClick={handleCloseModal}

                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </main >
    </>
  )
}
