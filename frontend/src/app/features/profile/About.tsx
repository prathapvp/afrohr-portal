import React, { useState, useEffect } from 'react';
import { ActionIcon, Button, Modal, Textarea, TextInput, Alert } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { persistProfile } from '../../store/slices/ProfileSlice';
import { successNotification, errorNotification } from '../../services/NotificationService';
import { extractErrorMessage } from '../../services/error-extractor-service';
import { useMediaQuery } from '@mantine/hooks';

const About: React.FC = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile) as {
    about?: string;
    cvHeadline?: string;
    profileSummary?: string;
    [key: string]: unknown;
  };

  const [about, setAbout] = useState<string>(profile.about || '');
  const [cvHeadline, setCvHeadline] = useState<string>(profile.cvHeadline || '');
  const [profileSummary, setProfileSummary] = useState<string>(profile.profileSummary || '');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const premiumInputStyles = {
    label: {
      color: '#d1d5db',
      fontWeight: 600,
      marginBottom: '6px',
    },
    input: {
      background: 'rgba(15, 23, 42, 0.55)',
      color: '#f3f4f6',
      borderColor: 'rgba(255, 255, 255, 0.14)',
    },
  };

  const matches = useMediaQuery('(max-width: 475px)');

  useEffect(() => {
    if (!editOpen) {
      setAbout(profile.about || '');
      setCvHeadline(profile.cvHeadline || '');
      setProfileSummary(profile.profileSummary || '');
    }
  }, [profile.about, profile.cvHeadline, profile.profileSummary, editOpen]);

  const handleOpenEdit = () => {
    setAbout(profile.about || '');
    setCvHeadline(profile.cvHeadline || '');
    setProfileSummary(profile.profileSummary || '');
    setEditOpen(true);
    setValidationError('');
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setValidationError('');
  };

  const handleSave = async () => {
    setValidationError('');

    try {
      await dispatch(persistProfile({ about, cvHeadline, profileSummary })).unwrap();
      successNotification('Success', 'About section updated');
      setEditOpen(false);
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      errorNotification('Update Failed', errorMessage);
    }
  };

  const hasContent = profile.about || profile.cvHeadline || profile.profileSummary;

  return (
    <div className="mt-2">
      <div className="flex justify-end mb-1">
        <ActionIcon
          onClick={handleOpenEdit}
          variant="subtle"
          color="brightSun.4"
          size={matches ? 'md' : 'lg'}
        >
          <IconPencil className="w-4/5 h-4/5" stroke={1.5} />
        </ActionIcon>
      </div>

      {hasContent ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          {profile.cvHeadline && (
            <div className="rounded-xl border border-bright-sun-300/25 bg-bright-sun-300/10 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-bright-sun-300">Headline</div>
              <p className="text-sm text-mine-shaft-100">{profile.cvHeadline}</p>
            </div>
          )}
          {profile.about && (
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-100">About</div>
              <p className="text-sm leading-7 text-mine-shaft-100 text-justify whitespace-pre-wrap">{profile.about}</p>
            </div>
          )}
          {profile.profileSummary && (
            <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/10 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-100">Summary</div>
              <p className="text-sm leading-7 text-mine-shaft-100 text-justify whitespace-pre-wrap">{profile.profileSummary}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-mine-shaft-400 sm:p-4">
          <p className="italic">No information added yet. Click edit to add your headline, about, and summary.</p>
        </div>
      )}

      <Modal
        opened={editOpen}
        onClose={handleCloseEdit}
        title="Edit About"
        centered
        size="lg"
        radius="xl"
        transitionProps={{ transition: 'fade', duration: 180 }}
        overlayProps={{ backgroundOpacity: 0.78, blur: 4, color: '#020617' }}
        styles={{
          content: {
            background:
              'radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 36%), linear-gradient(180deg, rgba(10,15,30,0.98), rgba(2,6,23,0.98))',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
          },
          header: {
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
            paddingBottom: '12px',
          },
          title: {
            color: '#f8fafc',
            fontWeight: 800,
            letterSpacing: '0.01em',
          },
          close: {
            color: '#cbd5e1',
          },
          body: {
            paddingTop: '16px',
          },
        }}
      >
        {validationError && (
          <Alert color="red" title="Error" mb="md" withCloseButton onClose={() => setValidationError('')}>
            {validationError}
          </Alert>
        )}

        <div className="flex flex-col gap-4">
          <TextInput
            label="CV Headline"
            placeholder="e.g., Immediate Joiner - Java Full Stack Developer"
            value={cvHeadline}
            onChange={(e) => setCvHeadline(e.currentTarget.value)}
            styles={premiumInputStyles}
          />
          <Textarea
            label="About Me"
            placeholder="Tell employers about yourself"
            value={about}
            onChange={(e) => setAbout(e.currentTarget.value)}
            autosize
            minRows={3}
            styles={premiumInputStyles}
          />
          <Textarea
            label="Profile Summary"
            placeholder="Summarize your professional background and expertise"
            value={profileSummary}
            onChange={(e) => setProfileSummary(e.currentTarget.value)}
            autosize
            minRows={3}
            styles={premiumInputStyles}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="light" color="gray" onClick={handleCloseEdit} className="rounded-full px-5">
              Cancel
            </Button>
            <Button color="brightSun.4" onClick={handleSave} className="rounded-full px-5 font-semibold text-mine-shaft-950">
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default About;
