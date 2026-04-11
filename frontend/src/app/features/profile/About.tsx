import React, { useState, useEffect } from 'react';
import { ActionIcon, Textarea, TextInput, Alert } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { persistProfile } from '../../store/slices/ProfileSlice';
import { successNotification, errorNotification } from '../../services/NotificationService';
import { extractErrorMessage } from '../../services/error-extractor-service';
import { useMediaQuery } from '@mantine/hooks';
import ProfileEditorModal, { premiumProfileInputStyles } from './ProfileEditorModal';

const About: React.FC = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile) as {
    about?: string;
    cvHeadline?: string;
    profileSummary?: string;
    [key: string]: unknown;
  };
  const user = useAppSelector((state) => state.user) as { accountType?: string } | null;

  const [about, setAbout] = useState<string>(profile.about || '');
  const [cvHeadline, setCvHeadline] = useState<string>(profile.cvHeadline || '');
  const [profileSummary, setProfileSummary] = useState<string>(profile.profileSummary || '');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

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
      const isEmployer = (user?.accountType ?? '').toUpperCase() === 'EMPLOYER';
      const payload = isEmployer
        ? { ...profile, about, cvHeadline, profileSummary }
        : { about, cvHeadline, profileSummary };

      await dispatch(persistProfile(payload)).unwrap();
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
          variant="light"
          color="yellow"
          size={matches ? 'md' : 'lg'}
          className="!bg-bright-sun-400/20 !text-bright-sun-300 hover:!bg-bright-sun-400/30"
        >
          <IconPencil className="w-4/5 h-4/5" stroke={1.5} />
        </ActionIcon>
      </div>

      {hasContent ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          {profile.cvHeadline && (
            <div className="rounded-xl border border-bright-sun-300/25 bg-bright-sun-300/10 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-bright-sun-300">Headline</div>
              <p className="text-sm text-slate-100">{profile.cvHeadline}</p>
            </div>
          )}
          {profile.about && (
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-100">About</div>
              <p className="text-sm leading-7 text-slate-100 text-justify whitespace-pre-wrap">{profile.about}</p>
            </div>
          )}
          {profile.profileSummary && (
            <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/10 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-100">Summary</div>
              <p className="text-sm leading-7 text-slate-100 text-justify whitespace-pre-wrap">{profile.profileSummary}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300 sm:p-4">
          <p className="italic">No information added yet. Click edit to add your headline, about, and summary.</p>
        </div>
      )}

      <ProfileEditorModal
        opened={editOpen}
        onClose={handleCloseEdit}
        onSave={handleSave}
        title="Edit About"
        size="lg"
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
            styles={premiumProfileInputStyles}
          />
          <Textarea
            label="About Me"
            placeholder="Tell employers about yourself"
            value={about}
            onChange={(e) => setAbout(e.currentTarget.value)}
            autosize
            minRows={3}
            styles={premiumProfileInputStyles}
          />
          <Textarea
            label="Profile Summary"
            placeholder="Summarize your professional background and expertise"
            value={profileSummary}
            onChange={(e) => setProfileSummary(e.currentTarget.value)}
            autosize
            minRows={3}
            styles={premiumProfileInputStyles}
          />
        </div>
      </ProfileEditorModal>
    </div>
  );
};

export default About;
